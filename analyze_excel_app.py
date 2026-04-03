
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
                df = pd.read_excel(xls, sheet_name=sheet).head(10)
                print(f"\nSheet: {sheet}")
                print(f"Columns: {df.columns.tolist()}")
                # print(df.to_dict(orient='records'))
            except Exception as e:
                print(f"Could not read sheet {sheet}: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # analyze_excel(r"c:\Users\Eyal\source\repos\diamond-inventory\excel\inventory.xlsx")
    analyze_excel(r"c:\Users\Eyal\source\repos\diamond-inventory\excel\excel_app.xlsm")
