function multipleSequenceAlignment(sequences, basePerChunk = 10, chunksPerLine = 5, matchScore = 1, mismatchScore = -1, gapScore = -1) {
  // Clean up and validate the input sequences
  sequences = sequences.map(cleanup);
  
  // Calculate the distance matrix between the input sequences
  const distanceMatrix = calculateDistanceMatrix(sequences, matchScore, mismatchScore, gapScore);
  
  // Construct the guide tree based on the distance matrix
  const guideTree = constructGuideTree(distanceMatrix);
  
  // Perform progressive alignment using the guide tree
  const alignedSequences = progressiveAlignment(sequences, guideTree, matchScore, mismatchScore, gapScore);
  
  // Format the output as a 2D array
  const output = formatMultipleAlignment(alignedSequences, basePerChunk, chunksPerLine);

  return output;
}

function calculateDistanceMatrix(sequences, matchScore = 1, mismatchScore = -1, gapScore = -1) {
  const numSequences = sequences.length;
  const distanceMatrix = Array.from({ length: numSequences }, () => Array(numSequences).fill(0));

  for (let i = 0; i < numSequences; i++) {
    for (let j = i + 1; j < numSequences; j++) {
      const seq1 = sequences[i];
      const seq2 = sequences[j];
      const matrix = _buildMatrix(seq1, seq2, matchScore, mismatchScore, gapScore);
      const alignment = _traceback(seq1, seq2, matrix, matchScore, mismatchScore, gapScore);

      // Calculate the distance between the sequences based on the alignment
      const distance = calculateDistanceFromAlignment(alignment, matchScore, mismatchScore, gapScore);
      distanceMatrix[i][j] = distance;
      distanceMatrix[j][i] = distance;
    }
  }

  return distanceMatrix;
}

function calculateDistanceFromAlignment(alignment, matchScore, mismatchScore, gapScore) {
  const [alignedSeq1, alignedSeq2] = alignment;
  let distance = 0;

  for (let i = 0; i < alignedSeq1.length; i++) {
    if (alignedSeq1[i] === '-' || alignedSeq2[i] === '-') {
      distance += gapScore;
    } else if (alignedSeq1[i] !== alignedSeq2[i]) {
      distance += mismatchScore;
    } else {
      distance += matchScore;
    }
  }

  return distance;
}


function constructGuideTree(distanceMatrix) {
  let clusters = distanceMatrix.map((_, index) => [index]);

  while (clusters.length > 1) {
    // Find the pair of clusters with the minimum distance
    let minDistance = Infinity;
    let minIndex1 = -1;
    let minIndex2 = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const distance = averageDistance(clusters[i], clusters[j], distanceMatrix);
        if (distance < minDistance) {
          minDistance = distance;
          minIndex1 = i;
          minIndex2 = j;
        }
      }
    }

    // Merge the two clusters with the minimum distance
    const mergedCluster = clusters[minIndex1].concat(clusters[minIndex2]);
    clusters.splice(minIndex2, 1);
    clusters[minIndex1] = mergedCluster;
  }

  return clusters[0];
}

function averageDistance(cluster1, cluster2, distanceMatrix) {
  let totalDistance = 0;
  let count = 0;

  for (const index1 of cluster1) {
    for (const index2 of cluster2) {
      totalDistance += distanceMatrix[index1][index2];
      count++;
    }
  }

  return totalDistance / count;
}

function progressiveAlignment(sequences, guideTree, matchScore = 1, mismatchScore = -1, gapScore = -1) {
  const alignedSequences = sequences.map(seq => seq.split(''));

  while (guideTree.length > 1) {
    let minDistance = Infinity;
    let minIndex1 = -1;
    let minIndex2 = -1;

    // Find the pair of sequences with the minimum distance
    for (let i = 0; i < guideTree.length; i++) {
      for (let j = i + 1; j < guideTree.length; j++) {
        const index1 = guideTree[i];
        const index2 = guideTree[j];
        const seq1 = sequences[index1];
        const seq2 = sequences[index2];
        const matrix = _buildMatrix(seq1, seq2, matchScore, mismatchScore, gapScore);
        const alignment = _traceback(seq1, seq2, matrix, matchScore, mismatchScore, gapScore);
        const distance = calculateDistanceFromAlignment(alignment, matchScore, mismatchScore, gapScore);

        if (distance < minDistance) {
          minDistance = distance;
          minIndex1 = i;
          minIndex2 = j;
        }
      }
    }

    // Align the two sequences with the minimum distance
    const index1 = guideTree[minIndex1];
    const index2 = guideTree[minIndex2];
    const seq1 = sequences[index1];
    const seq2 = sequences[index2];
    const matrix = _buildMatrix(seq1, seq2, matchScore, mismatchScore, gapScore);
    const [alignedSeq1, alignedSeq2] = _traceback(seq1, seq2, matrix, matchScore, mismatchScore, gapScore);

    // Update the aligned sequences
    alignedSequences[index1] = align(alignedSequences[index1], alignedSeq1);
    alignedSequences[index2] = align(alignedSequences[index2], alignedSeq2);

    // Merge the nodes in the guide tree
    const mergedNode = [index1, index2];
    guideTree.splice(minIndex2, 1);
    guideTree[minIndex1] = mergedNode;
  }

  return alignedSequences.map(seq => seq.join(''));
}

function align(sequence, alignedSequence) {
  const aligned = [];
  let seqIndex = 0;

  for (const base of alignedSequence) {
    if (base === sequence[seqIndex]) {
      aligned.push(base);
      seqIndex++;
    } else {
      aligned.push('-');
    }
  }

  return aligned;
}

function formatMultipleAlignment(alignedSequences, basePerChunk = 10, chunksPerLine = 5) {
  const output = [];
  const numSequences = alignedSequences.length;
  const alignmentLength = alignedSequences[0].length;
  const chunkSize = basePerChunk * chunksPerLine;
  
  for (let i = 0; i < alignmentLength; i += chunkSize) {
    for (let j = 0; j < numSequences; j++) {
      const sequence = alignedSequences[j];
      const indexLine = (j * 2).toString().padStart(4, ' ') + ' ';
      const sequenceLine = sequence.substring(i, i + chunkSize);
      const chunkedSequenceLine = sequenceLine.match(new RegExp(`.{1,${basePerChunk}}`, 'g')).join(' ');
      output.push([indexLine, chunkedSequenceLine]);
    }
    output.push(['']);
  }
  
  return output;
}
