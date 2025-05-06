/* C6-Tools Synthetic Biology Functions for Google Apps Script
    by J. Christopher Anderson with ChatGPT
    Copyright 2023 University of California, Berkeley
 */
/**
 * Retrieves metadata for a protein from NCBI's Protein database, given the protein's accession number.
 * 
 * @param {string} accessionNumber The accession number of the protein to retrieve metadata for.
 * @return {string} A JSON string representing the protein metadata. Fields include sequence
 * description, organism, sequence_type, taxonomy, and source.
 */
function fetchProtein(accessionNumber) {
  // Set the URL for the EFetch utility with the appropriate parameters
  var url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + accessionNumber + "&rettype=xml";
  // Logger.log("url: " + url);

  // Make a GET request to the NCBI E-utilities API
  var response = UrlFetchApp.fetch(url).getContentText();

  // Debugging - log the XML response to check if it contains the expected data
  // Logger.log("response: " + response);

  // Parse the XML response to extract metadata fields
  var data = XmlService.parse(response);
  // Logger.log("data: " + data);
  
  var gbset = data.getRootElement();
  // Logger.log("gbset: " + gbset);
  
  var gbseq = gbset.getChild("GBSeq");
  // Logger.log("gbseq: " + gbseq);

  var metadata = {
    "description": gbseq.getChildText("GBSeq_definition"),
    "organism": gbseq.getChildText("GBSeq_organism"),
    "sequence_type": gbseq.getChildText("GBSeq_moltype"),
    "taxonomy": gbseq.getChildText("GBSeq_taxonomy"),
    "source": gbseq.getChildText("GBSeq_source"),
    "sequence": gbseq.getChild("GBSeq_sequence").getText().toUpperCase() || ""
  };
  
  // Return the metadata
  return JSON.stringify(metadata);
}

function blastpSearch(query, email) {
  var database = "nr"; // Set the database to search
  var url = "https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Put&DATABASE=" + database + "&PROGRAM=blastp&EMAIL=" + email + "&QUERY=" + query;
  return url;

var response = UrlFetchApp.fetch(url, {
    method: "get",
    contentType: "application/xml"
  });
  var responseText = response.getContentText();

  var jobId = responseText.match(/RID = (.+)/)[1]; // Parse the job ID from the response
  Utilities.sleep(5000); // Wait for the job to be processed
  url = "https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&FORMAT_TYPE=XML&RID=" + jobId;
  var results = UrlFetchApp.fetch(url, {
    method: "get",
    contentType: "application/xml"
  }).getContentText();
  var document = XmlService.parse(results);
  var hits = document.getRootElement().getChild("BlastOutput_iterations").getChildren("Iteration");
  var homologs = [];
  for (var i = 0; i < hits.length; i++) {
    var hit = hits[i].getChild("Iteration_hits").getChildren("Hit")[0];
    var accession = hit.getChildText("Hit_accession");
    var score = hit.getChild("Hit_hsps").getChild("Hsp").getChildText("Hsp_bit-score");
    homologs.push({accession: accession, score: score});
  }
  return homologs;
}

/**
 * Retrieves the genomic sequence, CDS start, and CDS end for a gene based on its protein accession number.
 * 
 * @param {string} accessionNumber The protein accession number for the gene of interest.
 * @return {object} An object with the genomic sequence, CDS start, and CDS end for the gene.
 */
function getGeneData(accessionNumber) {
  // Retrieve the gene ID from the NCBI Protein database using the protein accession number
  var url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=protein&term=" + accessionNumber;
  var response = UrlFetchApp.fetch(url, {
    "muteHttpExceptions": true
  });
  if (response.getResponseCode() != 200) {
    Logger.log("Error retrieving gene ID: " + response.getContentText());
    return null;
  }
  var data = XmlService.parse(response.getContentText());
  var geneId = data.getRootElement().getChild("IdList").getChildText("Id");

  // Retrieve the genomic sequence and CDS coordinates for the gene using the NCBI E-utilities API
  url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=" + geneId + "&seq_start=&seq_stop=&rettype=fasta_cds_na";
  response = UrlFetchApp.fetch(url, {
    "muteHttpExceptions": true
  });
  if (response.getResponseCode() != 200) {
    Logger.log("Error retrieving gene data: " + response.getContentText());
    throw new Error("Error retrieving gene data");
  }
  var lines = response.getContentText().split("\n");
  var header = lines[0].split("|");
  var genomicSequence = lines.slice(1).join("").toUpperCase();
  var cdsStart = parseInt(header[1].split(":")[1]);
  var cdsEnd = parseInt(header[2].split(":")[1]);

  return JSON.stringify({
    "genomicSequence": genomicSequence,
    "cdsStart": cdsStart,
    "cdsEnd": cdsEnd
  });
}
