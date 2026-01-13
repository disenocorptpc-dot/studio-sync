$file = "c:\Users\rsantarosa\.gemini\antigravity\playground\triple-event\analisis.xlsx"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $wb = $excel.Workbooks.Open($file)
    $ws = $wb.Sheets.Item(1)
    
    # Read first 10 columns just to be safe
    $headers = @()
    for ($i = 1; $i -le 10; $i++) {
        $val = $ws.Cells.Item(1, $i).Text
        if ($val) { $headers += $val }
    }
    
    Write-Host "HEADERS_FOUND: $($headers -join ' | ')"
    
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($excel) { $excel.Quit() }
}
