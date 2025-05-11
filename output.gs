function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Export as CSV (with formulas)', functionName: 'exportAsCSVWithFormulas'}
  ];
  spreadsheet.addMenu('Custom', menuItems);
}

function exportAsCSVWithFormulas() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getDataRange();
  var numRows = range.getNumRows();
  var numColumns = range.getNumColumns();
  var csvData = [];

  // Add the header with column labels
  var header = [""];
  for (var i = 1; i <= numColumns; i++) {
    header.push(String.fromCharCode(64 + i));
  }
  csvData.push(header.join(','));

  // Process each cell, including row labels
  for (var i = 1; i <= numRows; i++) {
    var rowData = [i]; // Add row label
    for (var j = 1; j <= numColumns; j++) {
      var cell = sheet.getRange(i, j);
      var formula = cell.getFormula();
      rowData.push(formula ? formula : cell.getValue());
    }
    csvData.push(rowData.join(','));
  }

  // Create a new CSV file
  var csvBlob = Utilities.newBlob(csvData.join('\n'), 'text/csv', sheet.getName() + '.csv');
  var file = DriveApp.createFile(csvBlob);

  // Log the URL for the new CSV file
  Logger.log('CSV file created: %s', file.getUrl());
  Browser.msgBox('CSV file created: ' + file.getUrl());
}
