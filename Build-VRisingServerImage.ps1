$config = Get-Content -Raw -Path .\src\config.json | ConvertFrom-Json
Write-Host $config
$ImageName = $config.ImageName
$EcrRepoUri = $config.EcrRepoUri
$Region = $config.Region
$PersistentDataBucket = $config.PersistentDataBucket
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $EcrRepoUri
Set-Location src/
aws s3 sync "s3://$PersistentDataBucket" ./persistentdata --delete --profile $ProfileName
docker build -t "$($ImageName)" .
docker tag "$($ImageName):latest" "$($EcrRepoUri):latest"
docker push "$($EcrRepoUri):latest"
cd ..
