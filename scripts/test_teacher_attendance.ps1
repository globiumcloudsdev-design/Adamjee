param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Email = "shoaibrazamemon@gmail.com",
    [string]$Password = "12345678"
)

function Invoke-Json {
    param(
        [string]$Uri,
        [string]$Method = 'Get',
        $Body = $null,
        $Headers = @{}
    )
    try {
        if ($Body -ne $null) {
            $json = $Body | ConvertTo-Json -Compress
            return Invoke-RestMethod -Uri $Uri -Method $Method -Body $json -ContentType 'application/json' -Headers $Headers
        } else {
            return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers
        }
    } catch {
        Write-Host "ERROR calling $Uri -- $($_.Exception.Message)"
        return $null
    }
}

Write-Host "[1] Login teacher: $Email"
$loginBody = @{ login = $Email; password = $Password }
$loginResp = Invoke-Json -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody
if (-not $loginResp) { Write-Host "FAIL: login request failed"; exit 2 }
$token = $loginResp.accessToken
if (-not $token) { Write-Host "FAIL: no accessToken in login response"; exit 3 }
Write-Host "PASS: login OK, token present? $($null -ne $token)"
$headers = @{ Authorization = "Bearer $token" }

Write-Host "[2] GET /api/staff-attendance/me/status"
$statusUrl = "$BaseUrl/api/staff-attendance/me/status"
Write-Host "-> GET $statusUrl"
$status = Invoke-Json -Uri $statusUrl -Method Get -Headers $headers
if ($status -eq $null) { Write-Host "FAIL: status request failed" } else { Write-Host "PASS: status OK -> $($status | ConvertTo-Json -Compress)" }

Write-Host "[3] GET /api/staff-attendance/me/history (monthly)"
$month = $((Get-Date).Month)
$year = $((Get-Date).Year)
$historyUrl = "$BaseUrl/api/staff-attendance/me/history?filterType=monthly&month=$month&year=$year"
Write-Host "-> GET $historyUrl"
$history = Invoke-Json -Uri $historyUrl -Method Get -Headers $headers
if ($history -eq $null) { Write-Host "FAIL: history request failed" } else { Write-Host "PASS: history OK -> $($history | ConvertTo-Json -Depth 5)" }

Write-Host "[4] POST /api/staff-attendance/check-in"
$ci = Invoke-Json -Uri "$BaseUrl/api/staff-attendance/check-in" -Method Post -Body @{} -Headers $headers
if ($ci -eq $null) { Write-Host "FAIL: check-in failed" } else { Write-Host "PASS: check-in -> $($ci | ConvertTo-Json -Compress)" }

Start-Sleep -Seconds 1

Write-Host "[5] POST /api/staff-attendance/check-out"
$co = Invoke-Json -Uri "$BaseUrl/api/staff-attendance/check-out" -Method Post -Body @{} -Headers $headers
if ($co -eq $null) { Write-Host "FAIL: check-out failed" } else { Write-Host "PASS: check-out -> $($co | ConvertTo-Json -Compress)" }

Write-Host "Done."