// function onOpen() {
//   storeFeaturesData();
// }

// /**
//  * This function is called on open
//  * It is not invocable from a cell
//  * It reads in another google sheet with the features
//  * It stores the data in a cache for 6 hrs
//  * After that, the page needs to be reloaded
//  */
// function storeFeaturesData() {
//   var sourceSheetId = '1eyrNA1ihmcU6l-4Kok2_SE29bvpdKb7cWHDrPrZ_aRI';
//   var sourceSheetName = 'Sheet1';

//   var sourceSpreadsheet = SpreadsheetApp.openById(sourceSheetId);
//   var sourceSheet = sourceSpreadsheet.getSheetByName(sourceSheetName);

//   var lastRow = sourceSheet.getLastRow();
//   var lastCol = sourceSheet.getLastColumn();
//   var featuresData = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();

//   var cache = CacheService.getScriptCache();
//   cache.put('featuresData', JSON.stringify(featuresData), 21600); // Store for 6 hours (maximum allowed time)
// }

// function getThirdLineAsArray() {
//   var cache = CacheService.getScriptCache();
//   var storedFeaturesData = cache.get('featuresData');

//   if (storedFeaturesData) {
//     var featuresData = JSON.parse(storedFeaturesData);
//     if (featuresData.length >= 3) {
//       // Return the third line as an array
//       return featuresData[2];
//     } else {
//       console.log("The features data has less than 3 lines.");
//       return "The features data has less than 3 lines.";
//     }
//   } else {
//     console.log("Data not stored yet or expired.");
//     return "Data not stored yet or expired.";
//   }
// }


// /**
//  * This worked once, but not working now, permissions.
//  */
// function createGenbankFile() {
//   var genbankContent = `LOCUS       TestSeq                12 bp    DNA     linear   UNA 01-JAN-1980
// DEFINITION  Test sequence for Google Apps Script demo.
// ACCESSION   TestSeq
// VERSION     TestSeq.1  GI:123456789
// KEYWORDS    .
// SOURCE      .
//   ORGANISM  .
//             .
// FEATURES             Location/Qualifiers
//      source          1..12
//                      /organism="."
//                      /mol_type="genomic DNA"
// ORIGIN
//         1 atgcgtagct ag
// //`;

//   // Create a genbank file in Google Drive
//   var fileName = 'test_genbank_file.gb';
//   var folder = DriveApp.getRootFolder();
//   var file = folder.createFile(fileName, genbankContent, MimeType.PLAIN_TEXT);
  
//   // Read the file content
//   var fileContent = DriveApp.getFileById(file.getId()).getBlob().getDataAsString();
  
//   // Write the content to the active sheet
//   var sheet = SpreadsheetApp.getActiveSheet();
//   var lines = fileContent.split('\n');
  
//   for (var i = 0; i < lines.length; i++) {
//     sheet.getRange(i + 1, 1).setValue(lines[i]);
//   }
// }
