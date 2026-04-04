$ErrorActionPreference = "Continue"
$base = "http://localhost:5000/api"
$h = @{"Content-Type"="application/json"}
$tu = "e2etest_$(Get-Random -Minimum 1000 -Maximum 9999)"
$tp = "Test@12345"
$mob = "90$(Get-Random -Minimum 10000000 -Maximum 99999999)"
$pass = 0; $fail = 0; $skip = 0

function Pass($msg) { $script:pass++; Write-Host "  PASS: $msg" -ForegroundColor Green }
function Fail($msg) { $script:fail++; Write-Host "  FAIL: $msg" -ForegroundColor Red }
function Skip($msg) { $script:skip++; Write-Host "  SKIP: $msg" -ForegroundColor Yellow }

# 1. Health
Write-Host "`n[1] Health Check"
try { $r = Invoke-RestMethod "$base/../" -Method GET; Pass $r.message } catch { Fail $_.Exception.Message }

# 2. Register
Write-Host "[2] Register User ($tu)"
try { $r = Invoke-RestMethod "$base/auth/register" -Method POST -Body (@{name=$tu; mobile=$mob; password=$tp} | ConvertTo-Json) -Headers $h; Pass "success=$($r.success)" } catch { Fail $_.ErrorDetails.Message }

# 3. Login pending user (should be rejected)
Write-Host "[3] Login Pending User"
try { $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body (@{name=$tu; password=$tp} | ConvertTo-Json) -Headers $h; Fail "Should have been rejected" } catch { $msg = $_.ErrorDetails.Message; if ($msg -match "pending|approved") { Pass "Correctly rejected" } else { Fail $msg } }

# 4. Admin Login
Write-Host "[4] Admin Login"
try { $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body (@{name="Manoj"; password="Bible@0143"} | ConvertTo-Json) -Headers $h; $script:at = $r.token; Pass "got token" } catch { Fail $_.ErrorDetails.Message }
$ah = @{"Content-Type"="application/json"; "Authorization"="Bearer $($script:at)"}

# 5. Admin Stats
Write-Host "[5] Admin Stats"
try { $r = Invoke-RestMethod "$base/admin/stats" -Method GET -Headers $ah; Pass "users=$($r.users) pending=$($r.pending)" } catch { Fail $_.ErrorDetails.Message }

# 6. Pending Users
Write-Host "[6] Pending Users"
try { $r = Invoke-RestMethod "$base/admin/pending-users" -Method GET -Headers $ah; $pu = $r | Where-Object { $_.name -eq $tu }; if ($pu) { $script:tid = $pu._id; Pass "found test user id=$($script:tid)" } else { Pass "count=$($r.Count) (test user may not be pending)"; $allU = Invoke-RestMethod "$base/admin/users" -Method GET -Headers $ah; $fu = $allU | Where-Object { $_.name -eq $tu }; if ($fu) { $script:tid = $fu._id; Write-Host "    Found in all users: $($script:tid)" } } } catch { Fail $_.ErrorDetails.Message }

# 7. Approve User
Write-Host "[7] Approve User"
if ($script:tid) { try { $r = Invoke-RestMethod "$base/admin/approve/$($script:tid)" -Method PUT -Headers $ah; Pass $r.message } catch { Fail $_.ErrorDetails.Message } } else { Skip "no test user ID" }

# 8. Member Login
Write-Host "[8] Member Login"
try { $r = Invoke-RestMethod "$base/auth/login" -Method POST -Body (@{name=$tu; password=$tp} | ConvertTo-Json) -Headers $h; $script:mt = $r.token; Pass "got token" } catch { Fail $_.ErrorDetails.Message }
$mh = @{"Content-Type"="application/json"; "Authorization"="Bearer $($script:mt)"}

# 9. Get Profile
Write-Host "[9] Get Profile"
try { $r = Invoke-RestMethod "$base/profile/me" -Method GET -Headers $mh; Pass "name=$($r.name) role=$($r.role)" } catch { Fail $_.ErrorDetails.Message }

# 10. Update Profile
Write-Host "[10] Update Profile"
try { $r = Invoke-RestMethod "$base/profile/me" -Method PUT -Body (@{email="test@example.com"} | ConvertTo-Json) -Headers $mh; Pass "email=$($r.email)" } catch { Fail $_.ErrorDetails.Message }

# 11. Public Events
Write-Host "[11] Public Events"
try { $r = Invoke-RestMethod "$base/events" -Method GET; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 12. Public Sermons
Write-Host "[12] Public Sermons"
try { $r = Invoke-RestMethod "$base/sermons" -Method GET; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 13. Public Announcements
Write-Host "[13] Public Announcements"
try { $r = Invoke-RestMethod "$base/announcements" -Method GET; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 14. Admin Create Event
Write-Host "[14] Admin Create Event"
try { $sd = [DateTime]::UtcNow.AddDays(7).ToString("o"); $r = Invoke-RestMethod "$base/events" -Method POST -Body (@{title="E2E Test Event"; description="Test"; startDate=$sd; location="Hall"} | ConvertTo-Json) -Headers $ah; $script:eid = $r.event._id; Pass "id=$($r.event._id)" } catch { Fail $_.ErrorDetails.Message }

# 15. Admin Create Announcement
Write-Host "[15] Admin Create Announcement"
try { $sd = [DateTime]::UtcNow.ToString("o"); $r = Invoke-RestMethod "$base/announcements" -Method POST -Body (@{title="E2E Announcement"; content="Test content"; startDate=$sd} | ConvertTo-Json) -Headers $ah; $script:aid = $r._id; Pass "id=$($script:aid)" } catch { Fail $_.ErrorDetails.Message }

# 16. Admin Create Sermon
Write-Host "[16] Admin Create Sermon"
try { $r = Invoke-RestMethod "$base/sermons" -Method POST -Body (@{title="E2E Sermon"; content="Sermon body"; speaker="Pastor"; date=(Get-Date).ToString("yyyy-MM-dd")} | ConvertTo-Json) -Headers $ah; $script:sid = $r._id; Pass "id=$($r._id)" } catch { Fail $_.ErrorDetails.Message }

# 17. Member Create Prayer Request
Write-Host "[17] Create Prayer Request"
try { $r = Invoke-RestMethod "$base/prayer-requests" -Method POST -Body (@{title="E2E Prayer"; description="Test prayer"} | ConvertTo-Json) -Headers $mh; $script:prid = $r.request._id; Pass "id=$($r.request._id)" } catch { $em = $_.ErrorDetails.Message; if (-not $em) { $em = $_.Exception.Message }; Fail $em }

# 18. Get Prayer Requests
Write-Host "[18] Get Prayer Requests"
try { $r = Invoke-RestMethod "$base/prayer-requests" -Method GET -Headers $mh; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 19. Member Dashboard
Write-Host "[19] Member Dashboard"
try { $r = Invoke-RestMethod "$base/member/dashboard" -Method GET -Headers $mh; Pass "keys=$($r.PSObject.Properties.Name -join ',')" } catch { Fail $_.ErrorDetails.Message }

# 20. My Donations (member)
Write-Host "[20] Get My Donations"
try { $r = Invoke-RestMethod "$base/donations/mine" -Method GET -Headers $mh; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 21. Baptisms
Write-Host "[21] Get Baptisms"
try { $r = Invoke-RestMethod "$base/baptisms" -Method GET -Headers $mh; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 22. Marriages
Write-Host "[22] Get Marriages"
try { $r = Invoke-RestMethod "$base/marriages" -Method GET -Headers $mh; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 23. Sacraments
Write-Host "[23] Get Sacraments"
try { $r = Invoke-RestMethod "$base/sacraments" -Method GET -Headers $mh; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 24. Admin All Data
Write-Host "[24] Admin All Data"
try { $r = Invoke-RestMethod "$base/admin/all-data" -Method GET -Headers $ah; Pass "keys=$($r.PSObject.Properties.Name -join ',')" } catch { Fail $_.ErrorDetails.Message }

# 25. Activity Logs
Write-Host "[25] Admin Activity Logs"
try { $r = Invoke-RestMethod "$base/admin/activity-logs" -Method GET -Headers $ah; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 26. Notifications
Write-Host "[26] Admin Notifications"
try { $r = Invoke-RestMethod "$base/admin/notifications" -Method GET -Headers $ah; Pass "count=$(@($r).Count)" } catch { Fail $_.ErrorDetails.Message }

# 27. Reject User
Write-Host "[27] Reject User"
if ($script:tid) { try { $r = Invoke-RestMethod "$base/admin/reject/$($script:tid)" -Method PUT -Headers $ah; Pass $r.message } catch { Fail $_.ErrorDetails.Message } } else { Skip "no test user ID" }

# 28. Delete Test User
Write-Host "[28] Delete Test User"
if ($script:tid) { try { $r = Invoke-RestMethod "$base/admin/delete/$($script:tid)" -Method DELETE -Headers $ah; Pass $r.message } catch { Fail $_.ErrorDetails.Message } } else { Skip "no test user ID" }

# Cleanup
Write-Host "`n[Cleanup]"
if ($script:eid) { try { Invoke-RestMethod "$base/events/$($script:eid)" -Method DELETE -Headers $ah | Out-Null; Write-Host "  Deleted event" } catch { Write-Host "  Event: $($_.ErrorDetails.Message)" } }
if ($script:aid) { try { Invoke-RestMethod "$base/announcements/$($script:aid)" -Method DELETE -Headers $ah | Out-Null; Write-Host "  Deleted announcement" } catch { Write-Host "  Announcement: $($_.ErrorDetails.Message)" } }
if ($script:sid) { try { Invoke-RestMethod "$base/sermons/$($script:sid)" -Method DELETE -Headers $ah | Out-Null; Write-Host "  Deleted sermon" } catch { Write-Host "  Sermon: $($_.ErrorDetails.Message)" } }
if ($script:prid) { try { Invoke-RestMethod "$base/prayer-requests/$($script:prid)" -Method DELETE -Headers $mh | Out-Null; Write-Host "  Deleted prayer request" } catch { Write-Host "  Prayer: $($_.ErrorDetails.Message)" } }

# Also clean up the two test users from earlier registration tests
try { $allU = Invoke-RestMethod "$base/admin/users" -Method GET -Headers $ah; $allU | Where-Object { $_.name -match "^testuser_" -or $_.name -match "^e2etest_" } | ForEach-Object { try { Invoke-RestMethod "$base/admin/users/$($_._id)" -Method DELETE -Headers $ah | Out-Null; Write-Host "  Cleaned up user: $($_.name)" } catch {} } } catch {}

Write-Host "`n========================================="
Write-Host "RESULTS: $pass PASS | $fail FAIL | $skip SKIP"
Write-Host "========================================="
