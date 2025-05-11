/**
 * C6-Tools Splice By Overlap Extension (SOE) Function for Google Apps Script
 * by Richie Woo
 * 
 * Last Modified: May 10, 2025
 * 
 * Description: The SOE Function within C6-Sim is a function for use in Google Sheets that executes 
 * simulation of Splice by Overlap Extension PCR as described in the Construction File (CF) specification 
 * (Ataii et al. 2023), including check mechanisms to detect multiple anneal sites by templates and 
 * automatic rotation of templates.
 * 
 * The algorithm accepts the following inputs:
 * @param {string} headOligoSeq - The forward oligo sequence with at least 18bp homology to the 5' end of 
 *  the first template sequence.
 * @param {string} tailOligoSeq - The reverse oligo sequence with at least 18bp homology to the 3' end of 
 *  the last template sequence.
 * @param {array} templateSeqs - A list of template sequences which will be joined in the order given in 
 *  the construction file according to their homology sites.
 * 
 * Note 1: 5' of tailOligoSeq must be complementary to the 3' of the last template in templateSeqs, and the 
 * 3' of headOligoSeq must be homologous to the 5' of the first template in templateSeqs, respecting the 
 * actual oligo sequences needed to achieve PCR and following the standard set by the PCR function. 
 * However, the algorithm is tolerant of and will accept templates in templateSeqs that are reverse 
 * complemented from the "correct" orientation as set by the directionality of the homologous sequence 
 * between the first and second templates. This is because the templates are dsDNA that have both a coding 
 * and complementary strand, both of which can successfully bind with other templates to achieve SOE. 
 * Therefore, it makes sense to force the user to present the correct oligo sequences that would actually 
 * be used in a real-world experiment, but it is acceptable to provide templates of opposite reading 
 * directions because they would be accompanied by a strand of the correct reading direction in a real 
 * experiment.
 * 
 * Note 2: The minimum homology ("overlap" per the article's specific terminology) suggested by Luo et al. 
 * in their 2013 paper is 15bp to control melting temperature (Tm) within 68-70C. The maximum optimal 
 * homology overlap is 30bp to prevent an excessively high Tm, but a restriction on this has not been 
 * included in this iteration of the SOE algorithm to provide the maximum use case/functionality for end 
 * users, who may desire to use the algorithm alternatively.
 * 
 * The algorithm follows the following steps:
 * 1. The algorithm attempts to join the first template to the second template, the fusion of the two 
 *  templates to the third template, and so on, iterating through each template in templateSeqs and 
 *  applying the SOEAnnealByHomology sub-function, described below:
 *      
 *      SOE Anneal By Homology (SOEAnnealByHomology):
 *       This sub-function accepts the following inputs:
 *          @param {string} headTemplateSeq - The first template sequence designated to be 5' to the 
 *           tailTemplateSeq, AKA "HEAD"
 *          @param {string} tailTemplateSeq - The second template sequence designated to be 3' to the 
 *           headTemplateSeq, AKA "TAIL"
 *          @param {number} index - The index of tailTemplateSeq within the parent templateSeqs which is 
 *           used for reporting errors.
 * 
 *       This sub-function follows the following steps:
 *          1. Verify that a minimum 20bp homology exists between the 3' end of HEAD and 5' end of TAIL to 
 *           ensure that the sequences can prime PCR.
 *          2. If no homology exists at those locations for HEAD and TAIL, first rotate TAIL, then rotate 
 *           HEAD, then rotate TAIL to ensure all combinations of HEAD, TAIL, and their complements will 
 *           bind to each other in a way that supports SOE. If no combination is acceptable, throw an 
 *           error.
 *          3. Obtain sequences of the last 20bp of HEAD and the first 20bp of TAIL.
 *          4. Find the index of TAIL where the last 20bp of HEAD anneals.
 *          5. Find how many times the first 20bp of TAIL anneals to HEAD. If the number is 0, then throw 
 *           an error since SOE will not produce a product that includes all given templates. If the number
 *           is greater than 1, then throw an error as TAIL may anneal to multiple sites in HEAD, creating 
 *           one desired PCR product and multiple undesired PCR products. If the number is 1, find the 
 *           index on HEAD where TAIL anneals.
 *          6. Using the indices, verify that the annealing regions on HEAD and TAIL are homologous. If 
 *           some base pairs on 3' of HEAD or 5' of TAIL are not homologous to the other sequence, then the
 *           overhang will prevent PCR and the resulting PCR product will not be as expected. Throw an 
 *           error if the fragments' priming ends are not homologous.
 *          7. If all is well, return a sequence that is joined by the homology between HEAD and TAIL.
 * 
 * The resultant sequence is passed as fusionTemplateSeq.
 * 
 * 2. Verify that headOligoSeq and tailOligoSeq anneal to the 5' and 3' of fusionTemplateSeq, respectively.
 *  This operation will not check if there are any other sites of homology within fusionTemplateSeq, 
 *  following the standard set by the PCR function. 
 * 
 * 3. Calls the PCR function to return the product of headOligoSeq, tailOligoSeq, and fusionTemplateSeq as 
 *  if it were a normal PCR reaction (which it fundamentally is).
 * 
 * Note: The functionality of Step 2 is already included in the PCR function call in Step 3. However, to
 * facilitate better error message reporting, a separate check done before the PCR function call is done to
 * bypass error messages that may pop up when the PCR function is called, so users have a clearer
 * understanding of where problems are.
 * 
 * Usage: To use this function, the easiest method is to make a copy of a Google Sheet containing
 * the script within the context of all C6-Tools as of May 10, 2025:
 * 
 * - Primary Sheet for development of C6-Tool SOE function: 
 * https://docs.google.com/spreadsheets/d/1tis4HcyMGDtn-7EBGC3bbOmkYXL2WKAta0uY3PBGuA8/edit?usp=sharing
 *
 * Alternatively, you could open a Google Sheet and navigate to the Tools menu. Select "Extensions > 
 * Apps Script" and paste in the scripts that you need. Save the scripts and return to your sheet. You 
 * can then call the functions from within any cell.
 *
 * The scripts are also publicly available on GitHub where you may explore the development process of this
 * function:
 * 
 * - GitHub Repo:
 * https://github.com/richie-woo-berkeley/Richie-Final-C6-Tools
 * 
 * The file extensions of the scripts on the GitHub are .gs to match those in Google Apps Script.
 *
 * The code has not been tested in the script engine of a browser nor NodeJS, but it should work there too.
 *
 * The distributions contain example Sheets showing how to use the functions for various tasks. Additional
 * Sheets are used for testing and more nuanced usage illustration of some functions. You do not need to
 * retain these examples for the tools to function properly; the Sheets can be deleted. The header comments
 * for each function also include more technical information about their respective APIs.
 * 
 * Limitations: 
 * 
 * - Due to limitations in the Google Apps Script environment, these functions may be slower 
 * than equivalent functions running natively on a local computer. The degree of testing is uneven
 * across this project, so beware that there may be bugs and major errors.
 * 
 * - Similar to the PCR function, the SOE function does not check for potential homology by the TAIL strand
 * outside of the desired 5' homology site to locations in the HEAD strand that are not the desired 
 * homology site at the 3' location. Therefore, the simulator may only predict the ideal product in 
 * situations where there may be multiple erroneous products produced by unintended homology sites.
 * Theoretically, unintended novel sequences should only occur if there is homology to HEAD at the 3' end 
 * of TAIL. Homology inside the TAIL sequence with the HEAD sequence will create floating unpaired ends
 * that prevent further PCR.
 *
 * Contact: For questions or feedback on C6-Tools SOE Function, contact Richie Woo at:
 * richie.woo@berkeley.edu
 * 
 * Citations:
 * 
 * Luo WG, Liu HZ, Lin WH, Kabir MH, Su Y. Simultaneous splicing of multiple DNA fragments in one PCR 
 *  reaction. Biol Proced Online. 2013 Sep 9;15(1):9. doi: 10.1186/1480-9222-15-9. PMID: 24015676; 
 *  PMCID: PMC3847634.
 * 
 * Ataii N, Bakshi S, Chen Y, Fernandez M, Shao Z, Scheftel Z, et al. (2023) Enabling AI in synthetic 
 *  biology through Construction File specification. PLoS ONE 18(11): e0294469. 
 *  https://doi.org/10.1371/journal.pone.0294469
 * 
 * Copyright 2025 University of California, Berkeley
 * 
 * @license See the LICENSE file included in the repository
 */