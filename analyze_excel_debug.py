
import pandas as pd
import json

def analyze_excel(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name='Diamonds Export').head(5)
        # Select key columns for analysis
        cols = ['Stock#', 'Marketing', 'Is matched pair', 'Qty', 'Country']
        sub_df = df[cols]
        print(sub_df.to_dict(orient='records'))
        
        # Also check unique values for Fluorescence, Lab, Certificate
        print("\nFluorescence Unique:", df['Fluorescence'].unique().tolist())
        print("\nLab Unique:", df['Lab'].unique().tolist())
        print("\nCertificate Unique:", df['Certificate'].unique().tolist())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_excel(r"c:\Users\Eyal\source\repos\diamond-inventory\excel\inventory.xlsx")
