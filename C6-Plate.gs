/* C6-Tools Synthetic Biology Functions for Google Apps Script
    by J. Christopher Anderson with ChatGPT
    Copyright 2023 University of California, Berkeley
 */
function plateToMap(range) {
  var plateName = range[0][1];
  var labels = range[3];  //Column labels
  var result = {};
  for (var i = 4; i < range.length; i++) {
    var row = range[i];
    var rowLabel = row[0];
    
    for (var j = 1; j < row.length; j++) {
      if (!row[j]) {
        continue;
      }
      
      var colLabel = labels[j];
      
      var location = plateName + "/" + rowLabel + colLabel;
      result[row[j]] = location;
    }
  }
  return JSON.stringify(result);
}

function findSample(name,json) {
  var sampleMap = JSON.parse(json);
  return sampleMap[name];
}
