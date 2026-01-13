function doGet(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('StudioDB');
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        // Convertir string de 'pending' de vuelta a array
        if (obj.pending) obj.pending = obj.pending.toString().split(',').filter(Boolean);
        else obj.pending = [];
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('StudioDB');
    const params = JSON.parse(e.postData.contents);

    // Si es una actualización de todo el equipo (lo más fácil para este caso)
    if (Array.isArray(params)) {
        // Limpiar hoja (menos headers)
        if (sheet.getLastRow() > 1) {
            sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }

        // Preparar filas
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const newRows = params.map(p => {
            return headers.map(h => {
                if (h === 'pending') return p.pending.join(',');
                return p[h] || '';
            });
        });

        // Guardar
        if (newRows.length > 0) {
            sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
        }
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('StudioDB');
    if (!sheet) {
        sheet = ss.insertSheet('StudioDB');
        sheet.appendRow(['id', 'name', 'role', 'avatar', 'project', 'phase', 'client', 'deadline', 'pending']);
    }
}
