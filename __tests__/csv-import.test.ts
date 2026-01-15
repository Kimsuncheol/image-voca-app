import Papa from 'papaparse';

describe('CSV Import Field Mapping', () => {
  const sampleCSVWithRenamedHeaders = `,,,,
,Word,Meaning,Pronounciation,Example sentence
,seed,"n. 씨, 씨앗",,A farmer is sowing seeds in the field
,guilty,"a. 1. 유죄의
    2. 죄책감이 드는",,"1. Sadam Hussein turned out to be guilty
2. Kate felt guilty for her negligence"`;

  const sampleCSVStandard = `Word,Meaning,Pronounciation,Example sentence
seed,"n. 씨, 씨앗",,A farmer is sowing seeds in the field
guilty,"a. 1. 유죄의
    2. 죄책감이 드는",,"1. Sadam Hussein turned out to be guilty
2. Kate felt guilty for her negligence"`;

  // Helper function matching the actual uploadData logic
  const extractFields = (item: any) => {
    const word = String(
      item["Word"] || item["word"] || item["_1"] || ""
    ).trim();

    // Skip if this is the actual header row
    if (word === "Word" || !word) return null;

    return {
      word: word,
      meaning: String(
        item["Meaning"] || item["meaning"] || item["_2"] || ""
      ).trim(),
      pronunciation: String(
        item["Pronounciation"] ||
          item["Pronunciation"] ||
          item["pronunciation"] ||
          item["_3"] ||
          ""
      ).trim(),
      example: String(
        item["Example sentence"] || item["Example"] || item["example"] || item["_4"] || ""
      ).trim(),
    };
  };

  test('should parse CSV with renamed headers (_1, _2, _3, _4)', (done) => {
    Papa.parse(sampleCSVWithRenamedHeaders, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Parsed data:', results.data);
        
        expect(results.data.length).toBeGreaterThan(0);
        
        // Extract fields from all rows
        const extractedData = results.data
          .map(extractFields)
          .filter(item => item !== null);

        console.log('Extracted data:', extractedData);
        
        // Should have at least 2 words (seed and guilty)
        expect(extractedData.length).toBeGreaterThanOrEqual(2);
        
        // Check first word
        const firstWord = extractedData[0];
        expect(firstWord?.word).toBe('seed');
        expect(firstWord?.meaning).toBe('n. 씨, 씨앗');
        expect(firstWord?.example).toContain('farmer');
        
        done();
      },
      error: (error: any) => {
        done(error);
      }
    });
  });

  test('should parse CSV with standard headers', (done) => {
    Papa.parse(sampleCSVStandard, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Standard CSV parsed data:', results.data);
        
        const extractedData = results.data
          .map(extractFields)
          .filter(item => item !== null);

        console.log('Extracted data:', extractedData);
        
        expect(extractedData.length).toBeGreaterThanOrEqual(2);
        
        const firstWord = extractedData[0];
        expect(firstWord?.word).toBe('seed');
        expect(firstWord?.meaning).toBe('n. 씨, 씨앗');
        
        done();
      },
      error: (error: any) => {
        done(error);
      }
    });
  });

  test('should skip header row when it appears as data', (done) => {
    const csvWithHeaderAsData = `Word,Meaning,Pronounciation,Example sentence
Word,Meaning,Pronounciation,Example sentence
seed,"n. 씨, 씨앗",,A farmer is sowing seeds in the field`;

    Papa.parse(csvWithHeaderAsData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const extractedData = results.data
          .map(extractFields)
          .filter(item => item !== null);

        console.log('Filtered data:', extractedData);
        
        // Should only have 1 word (seed), header row should be skipped
        expect(extractedData.length).toBe(1);
        expect(extractedData[0]?.word).toBe('seed');
        
        done();
      },
      error: (error: any) => {
        done(error);
      }
    });
  });

  test('should handle empty fields gracefully', () => {
    const itemWithEmptyFields = {
      "_1": "test",
      "_2": "",
      "_3": "",
      "_4": ""
    };

    const result = extractFields(itemWithEmptyFields);
    
    expect(result).not.toBeNull();
    expect(result?.word).toBe('test');
    expect(result?.meaning).toBe('');
    expect(result?.pronunciation).toBe('');
    expect(result?.example).toBe('');
  });

  test('should handle both standard and renamed headers', () => {
    // Test with standard headers
    const standardItem = {
      "Word": "test",
      "Meaning": "테스트",
      "Pronounciation": "test",
      "Example sentence": "This is a test"
    };

    const standardResult = extractFields(standardItem);
    expect(standardResult?.word).toBe('test');
    expect(standardResult?.meaning).toBe('테스트');

    // Test with renamed headers
    const renamedItem = {
      "_1": "test2",
      "_2": "테스트2",
      "_3": "test2",
      "_4": "This is test 2"
    };

    const renamedResult = extractFields(renamedItem);
    expect(renamedResult?.word).toBe('test2');
    expect(renamedResult?.meaning).toBe('테스트2');
  });
});
