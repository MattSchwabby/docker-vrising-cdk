import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

const config = require('../src/config.json');

export class DockerVrisingCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const VRisingTaskDefinition = new ecs.FargateTaskDefinition(this, 'VRisingTaskDefinition', {
      cpu: 2048,
      memoryLimitMiB: 4096,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
      },
    });

    const VRisingServerLogGroup = new LogGroup(this, 'VRisingServerLogGroup', {
      retention: RetentionDays.ONE_MONTH,
    });

        const VRisingSaveBackups = new s3.Bucket(this, 'v-rising-save-backups', {
          bucketName: config.SaveBucket,
          removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE
        });

        const VRisingServerLogs = new s3.Bucket(this, 'v-rising-server-logs', {
          bucketName: config.LogBucket,
          removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE
        });

        const VRisingPersistentData = new s3.Bucket(this, 'v-rising-persistent-data-store', {
          bucketName: config.PersistentDataBucket,
          removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE
        });

        const VRisingContainerRepository = ecr.Repository.fromRepositoryName(this, config.EcrRepoArn, config.EcrRepoArn);

        // Define container definition
        VRisingTaskDefinition.addContainer('VRisingServerContainer', {
          image: ecs.ContainerImage.fromEcrRepository(VRisingContainerRepository,"latest"),
          logging: ecs.LogDriver.awsLogs({ streamPrefix: 'VRisingContainerRepository', logGroup: VRisingServerLogGroup }),
          essential: true,
          healthCheck: {
            command: ["sh", "-c", "ps -A | grep 'VRisingServer*' | grep -v grep"],
            startPeriod: cdk.Duration.seconds(300), // Adjust as needed
          },
          portMappings: [{
            containerPort: config.GamePort,
            hostPort: config.GamePort,
            protocol: ecs.Protocol.UDP
          },
          {
            containerPort: config.GamePort,
            hostPort: config.GamePort,
            protocol: ecs.Protocol.TCP
          },
          {
            containerPort: config.QueryPort,
            hostPort: config.QueryPort,
            protocol: ecs.Protocol.UDP
          },
          {
            containerPort: config.QueryPort,
            hostPort: config.QueryPort,
            protocol: ecs.Protocol.TCP
          },
          {
            containerPort: config.RconPort,
            hostPort: config.RconPort,
            protocol: ecs.Protocol.UDP
          },
          {
            containerPort: config.RconPort,
            hostPort: config.RconPort,
            protocol: ecs.Protocol.TCP
          },
          ]
          });
        

        VRisingTaskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
          actions: ['cloudwatch:PutMetricData','ecr:*','logs:CreateLogGroup','logs:CreateLogStream','logs:PutLogEvents','logs:DescribeLogStreams','s3:*'],
          resources: ['*'],
        }
        ));

        const VrisingServerVPC = new ec2.Vpc(this, 'VrisingServerVPC', {
          maxAzs: 2,
          natGateways: 2, 
          subnetConfiguration: [
            {
              subnetType: ec2.SubnetType.PUBLIC,
              name: 'VRisingServerPublic',
            },
            {
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, 
              name: 'VRisingServerPrivate', 
            },
          ],
        });

        const VRisingSecurityGroup = new ec2.SecurityGroup(this, 'VRisingSecurityGroup', {
          vpc: VrisingServerVPC,
          description: "Make V Rising Server accessible from the internet",
          allowAllOutbound: true
        });

        VRisingSecurityGroup.addIngressRule(
          ec2.Peer.ipv4("0.0.0.0/0"),
          ec2.Port.udp(config.GamePort)
        );
        
        VRisingSecurityGroup.addIngressRule(
          ec2.Peer.ipv4("0.0.0.0/0"),
          ec2.Port.tcp(config.GamePort)
        );
        
        VRisingSecurityGroup.addIngressRule(
          ec2.Peer.ipv4("0.0.0.0/0"),
          ec2.Port.udp(config.QueryPort)
        );
        
        VRisingSecurityGroup.addIngressRule(
          ec2.Peer.ipv4("0.0.0.0/0"),
          ec2.Port.tcp(config.QueryPort)
        );

        VRisingSecurityGroup.addIngressRule(
          ec2.Peer.ipv4("0.0.0.0/0"),
          ec2.Port.tcp(config.RconPort)
        );

        VRisingSecurityGroup.addIngressRule(
          ec2.Peer.ipv4("0.0.0.0/0"),
          ec2.Port.udp(config.RconPort)
        );
        
        const VRisingServerCluster = new ecs.Cluster(this, 'VRisingServerCluster',{
          vpc: VrisingServerVPC
        });

        const VRisingService = new ecs.FargateService (this, 'Service',{
          cluster: VRisingServerCluster,
          taskDefinition: VRisingTaskDefinition,
          desiredCount: 1,
          assignPublicIp: true,
          enableExecuteCommand: true,
          securityGroups: [VRisingSecurityGroup]
        });
  };
}
