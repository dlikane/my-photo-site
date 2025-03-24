# Load environment variables from root .env file
Get-Content ".\.env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim('"')
        Set-Item -Path env:$name -Value $value
    }
}

$clientId = $env:DROPBOX_APP_KEY
$clientSecret = $env:DROPBOX_APP_SECRET
$redirectUri = "http://localhost"

# Authorization URL
$authUrl = "https://www.dropbox.com/oauth2/authorize?client_id=$clientId&response_type=code&token_access_type=offline&redirect_uri=$redirectUri"

Start-Process $authUrl

$authCode = Read-Host "Enter the authorization code from Dropbox"

$headers = @{
    Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$clientId`:$clientSecret"))
    "Content-Type" = "application/x-www-form-urlencoded"
}

$body = @{
    code = $authCode
    grant_type = "authorization_code"
    redirect_uri = $redirectUri
}

$response = Invoke-RestMethod -Uri "https://api.dropbox.com/oauth2/token" -Method Post -Headers $headers -Body $body

$refreshToken = $response.refresh_token
$accessToken = $response.access_token

Write-Host "`n✅ Refresh Token: $refreshToken"
Write-Host "✅ Access Token: $accessToken"

# Optional: Update .env manually after confirming tokens
