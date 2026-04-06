
import pandas as pd
import json

def analyze_excel(file_path):
    try:
        df = pd.read_excel(file_path, sheet_name='Diamonds Export').head(1)
        print(json.dumps(df.columns.tolist(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_excel(r"c:\Users\Eyal\source\repos\diamond-inventory\excel\inventory.xlsx")
