/**
 * Parses raw values from Google Sheets API into structured objects.
 * Assumes the first row contains headers.
 *
 * @param values Array of arrays representing rows from Google Sheets
 * @returns Array of objects with keys corresponding to headers
 */
export function parseSheetValues(values: string[][]): any[] {
  if (!values || values.length < 2) {
    throw new Error("No data found or only header row exists.");
  }

  // First row is always headers
  const headers = values[0].map((h) => h.trim());

  // Subsequent rows are data
  const dataObjects = values.slice(1).map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      // Use empty string if cell is empty/undefined
      obj[header] = row[index] || "";
    });
    return obj;
  });

  return dataObjects;
}
