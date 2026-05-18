$baseUrl = 'http://localhost:3000'
$body = @{ login = 'shoaibrazamemon@gmail.com'; password = '12345678' } | ConvertTo-Json -Compress
try {
    $lr = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host 'LOGIN RESPONSE:' ($lr | ConvertTo-Json -Compress)
    $token = $lr.accessToken
    Write-Host 'TOKEN:' $token
    $headers = @{ Authorization = "Bearer $token" }
    $me = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host 'ME RESPONSE:' ($me | ConvertTo-Json -Compress)
    $status = Invoke-RestMethod -Uri "$baseUrl/api/staff-attendance/me/status" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host 'STATUS RESPONSE:' ($status | ConvertTo-Json -Compress)

    $month = $((Get-Date).Month)
    $year = $((Get-Date).Year)
    $historyUrl = "$baseUrl/api/staff-attendance/me/history?filterType=monthly&month=$month&year=$year"
    Write-Host "HISTORY -> GET $historyUrl"
    $history = Invoke-RestMethod -Uri $historyUrl -Method Get -Headers $headers -ErrorAction Stop
    Write-Host 'HISTORY RESPONSE:' ($history | ConvertTo-Json -Compress)
} catch {
    Write-Host 'ERROR:' $_.Exception.Message
}
