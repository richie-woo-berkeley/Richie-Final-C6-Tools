/* C6-Tools Synthetic Biology Functions for Google Apps Script
    by J. Christopher Anderson with ChatGPT
    Copyright 2023 University of California, Berkeley
 */
/**
 * Performs a global sequence alignment using the Needleman-Wunsch algorithm.
 * Takes two sequences, seq1 and seq2, and optional scoring parameters: matchScore, mismatchScore, and gapScore.
 * Returns a JSON string containing the aligned sequences.
 *
 * @param {string} seq1 - The first sequence to align
 * @param {string} seq2 - The second sequence to align
 * @param {number} [matchScore=1] - The score for matching bases (default: 1)
 * @param {number} [mismatchScore=-1] - The score for mismatched bases (default: -1)
 * @param {number} [gapScore=-1] - The score for introducing a gap (default: -1)
 * @return {string} JSON string containing the aligned sequences with keys seq1_aligned and seq2_aligned
 *
 * Example usage:
 * const seq1 = "ATGGATGATG";
 * const seq2 = "CTTCTCCTCG";
 * const alignmentStr = align(seq1, seq2);
 * const alignment = JSON.parse(alignmentStr);
 * console.log("Aligned Sequence 1:", alignment.seq1_aligned);
 * console.log("Aligned Sequence 2:", alignment.seq2_aligned);
 * @customfunction
 */
// function align(seq1, seq2, matchScore = 1, mismatchScore = -1, gapScore = -1) {
//   seq1 = cleanup(seq1);
//   seq2 = cleanup(seq2);

//   // Build the alignment matrix
//   const matrix = _buildMatrix(seq1, seq2, matchScore, mismatchScore, gapScore);

//   // Find the optimal alignment
//   const alignment = _traceback(seq1, seq2, matrix, matchScore, mismatchScore, gapScore);
  
//   return JSON.stringify(alignment);
// }

/**
 * Performs a global sequence alignment using the Needleman-Wunsch algorithm and formats the output as an array.
 * Takes two sequences, seq1 and seq2, and optional parameters: basePerChunk, chunksPerLine, matchScore, mismatchScore, and gapScore.
 * Returns a 2D array containing the formatted alignment with indices, sequences, and symbols.
 *
 * @param {string} seq1 - The first sequence to align
 * @param {string} seq2 - The second sequence to align
 * @param {number} [basePerChunk=10] - The number of bases per chunk (default: 10)
 * @param {number} [chunksPerLine=5] - The number of chunks per line (default: 5)
 * @param {number} [matchScore=1] - The score for matching bases (default: 1)
 * @param {number} [mismatchScore=-1] - The score for mismatched bases (default: -1)
 * @param {number} [gapScore=-1] - The score for introducing a gap (default: -1)
 * @return {Array<Array<string>>} 2D array containing the formatted alignment with indices, sequences, and symbols
 *
 * Example usage:
 * const seq1 = "ATGGATGATG";
 * const seq2 = "CTTCTCCTCG";
 * const formattedAlignment = showAlignment(seq1, seq2);
 * console.log(formattedAlignment);
 * @customfunction
 */
function showAlignment(seq1, seq2, basePerChunk = 10, chunksPerLine = 5, matchScore = 1, mismatchScore = -1, gapScore = -1) {
  seq1 = cleanup(seq1);
  seq2 = cleanup(seq2);
  // Build the alignment matrix
  const matrix = _buildMatrix(seq1, seq2, matchScore, mismatchScore, gapScore);

  // Find the optimal alignment
  const alignment = _traceback(seq1, seq2, matrix, matchScore, mismatchScore, gapScore);

  const output = _formatAsArray(alignment, basePerChunk, chunksPerLine);

  return output;
}

/**
 * Formats the alignment output as an array.
 * @private
 * @param {Object} alignment - The alignment object containing the aligned sequences.
 * @param {number} basePerChunk - The number of bases per chunk.
 * @param {number} chunksPerLine - The number of chunks per line.
 * @returns {Array<Array<string>>} - A 2D array containing the formatted alignment.
 */
function _formatAsArray(alignment, basePerChunk, chunksPerLine) {
  const seq1 = alignment.seq1_aligned;
  const seq2 = alignment.seq2_aligned;
  const length = seq1.length;

  let symbols = "";
  for (let i = 0; i < length; i++) {
    if (seq1[i] === seq2[i]) {
      symbols += "|";
    } else if (seq1[i] === "-" || seq2[i] === "-") {
      symbols += " ";
    } else {
      symbols += "x";
    }
  }

  function chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }

  function create2DArray(str, lineSize, blockSize) {
    const lines = chunkString(str, lineSize);
    const array2D = lines.map(line => chunkString(line, blockSize));
    return array2D;
  }

  const lineSize = chunksPerLine*basePerChunk;
  const blockSize = basePerChunk;
  const seq1Array = create2DArray(seq1, lineSize, blockSize);
  const seq2Array = create2DArray(seq2, lineSize, blockSize);
  const symbolsArray = create2DArray(symbols, lineSize, blockSize);

  const interlacedArray = [];
  for (let i = 0; i < seq1Array.length; i++) {
    interlacedArray.push(["", ...seq1Array[i]]);
    interlacedArray.push([`${i * lineSize + 1}`, ...symbolsArray[i]]);
    interlacedArray.push(["", ...seq2Array[i]]);
    interlacedArray.push(["", "", "", "", "", ""]);
  }

  return interlacedArray;
}

/**
 * Builds the alignment matrix for the Needleman-Wunsch algorithm.
 * @private
 * @param {string} seq1 - The first sequence.
 * @param {string} seq2 - The second sequence.
 * @param {number} [matchScore=1] - The score for matching bases.
 * @param {number} [mismatchScore=-1] - The score for mismatched bases.
 * @param {number} [gapScore=-1] - The score for introducing a gap.
 * @returns {Array<Array<number>>} - The alignment matrix.
 */
function _buildMatrix(seq1, seq2, matchScore = 1, mismatchScore = -1, gapScore = -1) {
  const M = seq1.length;
  const N = seq2.length;

  // Initialize the DP matrix
  const dp = [];
  for (let i = 0; i <= M; i++) {
    dp[i] = [];
    for (let j = 0; j <= N; j++) {
      dp[i][j] = 0;
    }
  }

  // Initialize the first row and first column
  for (let i = 0; i <= M; i++) {
    dp[i][0] = i * gapScore;
  }
  for (let j = 0; j <= N; j++) {
    dp[0][j] = j * gapScore;
  }

  // Fill in the DP matrix
  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      const match = dp[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchScore);
      const gap1 = dp[i - 1][j] + gapScore;
      const gap2 = dp[i][j - 1] + gapScore;
      dp[i][j] = Math.max(match, gap1, gap2, 0);
    }
  }

  return dp;
}

/**
 * Performs a traceback step in the Needleman-Wunsch algorithm to find the optimal alignment.
 * @private
 * @param {string} seq1 - The first sequence.
 * @param {string} seq2 - The second sequence.
 * @param {Array<Array<number>>} matrix - The alignment matrix.
 * @param {number} [matchScore=1] - The score for matching bases.
 * @param {number} [mismatchScore=-1] - The score for mismatched bases.
 * @param {number} [gapScore=-1] - The score for introducing a gap.
 * @returns {Object} - An object containing the aligned sequences.
 */
function _traceback(seq1, seq2, matrix, matchScore = 1, mismatchScore = -1, gapScore = -1) {
  const M = matrix.length;
  const N = matrix[0].length;
  
  let maxVal = -Infinity;
  let maxI = M - 1;
  let maxJ = N - 1;

  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (matrix[i][j] > maxVal) {
        maxVal = matrix[i][j];
        maxI = i;
        maxJ = j;
      }
    }
  }

  let i = maxI;
  let j = maxJ;
  const seq1_aligned = [];
  const seq2_aligned = [];

  while (i > 0 || j > 0) {
    const currentScore = matrix[i][j];
    const diagonalScore = i > 0 && j > 0 ? matrix[i - 1][j - 1] : -Infinity;
    const upScore = i > 0 ? matrix[i - 1][j] : -Infinity;
    const leftScore = j > 0 ? matrix[i][j - 1] : -Infinity;

    if (
      currentScore === diagonalScore + (seq1[i - 1] === seq2[j - 1] ? matchScore : mismatchScore)
    ) {
      seq1_aligned.push(seq1[i - 1]);
      seq2_aligned.push(seq2[j - 1]);
      i -= 1;
      j -= 1;
    } else if (currentScore === upScore + gapScore) {
      seq1_aligned.push(seq1[i - 1]);
      seq2_aligned.push("-");
      i -= 1;
    } else if (currentScore === leftScore + gapScore) {
      seq1_aligned.push("-");
      seq2_aligned.push(seq2[j - 1]);
      j -= 1;
    } else {
      break;
    }
  }

  return {
    seq1_aligned: seq1_aligned.reverse().join(""),
    seq2_aligned: seq2_aligned.reverse().join("")
  };
}
