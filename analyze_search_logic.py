
import pandas as pd
import json

def analyze_specific_sheets(file_path):
    xls = pd.ExcelFile(file_path)
    
    print("\n--- Sheet: ADVANCED_SEARCH ---")
    df_search = pd.read_excel(xls, sheet_name='ADVANCED_SEARCH')
    # Filter out completely empty rows and columns to see the layout
    df_search = df_search.dropna(how='all').dropna(axis=1, how='all')
    print(df_search.to_string())

    print("\n--- Sheet: LISTS ---")
    df_lists = pd.read_excel(xls, sheet_name='LISTS')
    # Show the first few columns which usually contain the list values
    print(df_lists.head(30).to_string())

if __name__ == "__main__":
    analyze_specific_sheets(r"c:\Users\Eyal\source\repos\diamond-inventory\excel\excel_app.xlsm")
