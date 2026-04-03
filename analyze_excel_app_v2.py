
import pandas as pd
import json
import os

def analyze_excel(file_path):
    print(f"--- Analyzing {file_path} ---")
    try:
        xls = pd.ExcelFile(file_path)
        sheet_names = xls.sheet_names
        print(f"Sheet names: {sheet_names}")
        
        for sheet in sheet_names:
            try:
                df = pd.read_excel(xls, sheet_name=sheet)
                print(f"\n--- Sheet: {sheet} ---")
                print(f"Shape: {df.shape}")
                print(f"Columns: {df.columns.tolist()}")
                print("First 5 rows:")
                print(df.head(5).to_string())
                
                if sheet == 'LISTS':
                    print("\nList values (first 20 rows):")
                    print(df.head(20).to_string())
                
                if sheet == 'ADVANCED_SEARCH':
                    print("\nSearch layout (first 20 rows):")
                    print(df.head(20).to_string())
                    
            except Exception as e:
                print(f"Could not read sheet {sheet}: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_excel(r"c:\Users\Eyal\source\repos\diamond-inventory\excel\excel_app.xlsm")
