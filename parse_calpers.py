#!/usr/bin/env python3
import re

raw_data = """2024 Golden Bay, L.P.    2025    $100,000,000    $24,096,354    $0    $24,094,625    N/M 1    1
2SP I, L.P.    2024    $300,000,000    $126,521,860    $0    $130,106,579    N/M 1    1
57 Stars Global Opportunities Fund 2 (CalPERS), LLC    2009    $500,000,000    $528,839,331    $517,174,941    $759,423,630    5.9%
57 Stars Global Opportunities Fund, LLC    2007    $430,000,000    $414,697,200    $557,770,250    $569,725,806    5.9%
AACP AP Investors, L.P.    2007    $14,108,080    $14,957,430    $16,898,666    $16,927,142    2.0%
AACP China Growth Investors    2007    $50,000,000    $52,040,183    $83,160,811    $83,506,880    7.9%
AACP India Investors B    2007    $5,000,000    $5,283,795    $20,533,202    $21,117,605    12.8%
AACP India Investors C    2009    $5,000,000    $5,315,535    $2,411,954    $4,736,269    -1.5%
AACP India Venture Investors A    2007    $5,000,000    $5,065,536    $5,653,594    $5,726,237    1.9%
Accel-KKR Capital Partners VII, LP    2025    $180,000,000    $2,515,603    $0    $0    N/M 1    1
Acrew Capital Fund III, L.P.    2024    $70,000,000    $12,648,841    $0    $11,001,215    N/M 1    1
Acrew Diversify Capital Fund II, L.P.    2024    $50,000,000    $3,044,793    $0    $2,031,443    N/M 1    1
Advent Global Technology II Limited Partnership    2022    $150,000,000    $102,024,862    $0    $126,464,715    12.6% 1    1
Advent International GPE IX Limited Partnership    2019    $550,000,000    $525,249,416    $152,794,529    $824,694,380    13.9%
Advent International GPE V-D, L.P.    2005    $80,804,238    $77,609,736    $187,471,024    $187,471,024    42.7%
Advent International GPE VI-A, L.P.    2008    $500,000,000    $502,306,204    $1,006,375,016    $1,042,594,495    16.3%
Advent International GPE VII-C, L.P.    2012    $450,000,000    $432,732,784    $733,760,966    $780,950,795    13.2%
Advent International GPE VIII-B Limited Partnership    2016    $500,000,000    $500,000,000    $658,834,015    $1,042,081,744    15.9%
Advent International GPE X Limited Partnership    2022    $650,000,000    $336,443,790    $0    $403,860,838    13.2% 1    1
AlpInvest Secondaries Fund (onshore) VII, L.P.    2021    $373,893,702    $369,919,723    $218,254,515    $503,684,119    15.8% 1    1
Amberbrook IX LP    2023    $150,000,000    $82,892,917    $5,456,530    $127,187,709    N/M 1    1
American Industrial Partners Capital Fund VIII, L.P.    2024    $200,000,000    $100,545,300    $3,898,028    $107,997,206    N/M 1    1
Apollo European Principal Finance Fund, L.P.    2008    $89,556,629    $165,281,284    $200,770,615    $200,879,291    11.9%
Apollo Investment Fund IV, L.P.    1998    $150,000,000    $154,085,315    $254,289,011    $254,328,456    8.5%
Apollo Investment Fund IX, L.P    2019    $550,000,000    $535,168,083    $298,393,564    $833,711,337    17.2%
Apollo Investment Fund VI, L.P.    2006    $520,000,000    $866,357,105    $1,218,417,644    $1,227,258,867    8.2%
Apollo Investment Fund VIII, L.P.    2013    $350,000,000    $497,808,561    $621,414,810    $711,071,870    8.8%
Ares Corporate Opportunities Fund III, L.P.    2008    $400,000,000    $512,078,628    $1,059,418,691    $1,060,579,822    20.2%
Ares Corporate Opportunities Fund V, L.P.    2017    $425,000,000    $477,162,390    $218,196,668    $605,101,309    5.7%
Ares Corporate Opportunities Fund VI, L.P.    2021    $250,000,000    $288,224,168    $102,871,301    $399,663,898    16.2% 1    1
Blackstone Capital Partners V L.P.    2006    $38,400,000    $794,822,847    $1,222,737,110    $1,222,737,110    7.8%
Blackstone Capital Partners VI L.P.    2011    $375,000,000    $544,078,975    $887,670,171    $977,898,016    12.4%
Blackstone Capital Partners VII, L.P.    2016    $375,000,000    $534,136,336    $623,246,616    $943,459,953    15.5%
Blackstone Capital Partners VIII, L.P.    2021    $262,500,000    $421,774,898    $276,860,548    $518,951,902    13.5% 1    1
Carlyle Partners V, L.P.    2007    $800,000,000    $1,067,512,609    $1,725,940,265    $1,752,117,213    12.8%
Carlyle Partners VI, L.P.    2013    $300,850,000    $597,079,518    $1,116,736,427    $1,188,180,318    15.9%
Carlyle Partners VII, L.P.    2018    $300,000,000    $605,512,059    $551,899,667    $888,114,051    13.3%
Cedar Street Partners LP    2021    $1,000,000,000    $290,576,015    $11,376,450    $608,300,181    38.2% 1    1
Cerberus CAL II Partners, L.P.    2017    $500,000,000    $423,762,376    $644,747,968    $1,115,626,868    22.0%
Clearlake Capital Partners III, LP    2012    $50,000,000    $70,740,191    $202,099,514    $203,947,082    40.7%
Clearlake Capital Partners IV, L.P.    2015    $56,700,000    $88,850,635    $146,491,947    $182,049,769    27.7%
Clearlake Capital Partners V, L.P.    2018    $75,000,000    $112,539,514    $155,387,066    $230,006,819    34.3%
Clayton, Dubilier & Rice Fund X, L.P.    2018    $150,000,000    $161,652,863    $246,730,671    $379,179,736    30.9%
CVC European Equity Partners III LP    2001    $200,000,000    $234,497,567    $595,574,634    $608,904,117    41.0%
Francisco Partners III, L.P.    2011    $100,000,000    $95,284,663    $294,444,853    $325,185,091    22.9%
Hellman & Friedman Capital Partners VII    2011    $300,000,000    $286,896,670    $945,792,700    $969,940,867    24.6%
Insight Venture Partners Growth-Buyout Coinvestment Fund (B), L.P.    2015    $400,000,000    $433,400,000    $950,221,432    $1,539,567,005    26.3%
Insight Venture Partners IX, L.P.    2015    $100,000,000    $105,668,637    $232,182,263    $414,292,168    23.4%
Insight Venture Partners X, L.P.    2018    $250,000,000    $261,808,718    $246,946,063    $734,041,852    23.0%
KKR 2006 Fund L.P.    2006    $400,000,000    $595,407,506    $940,703,667    $940,703,667    8.2%
Permira Europe III    2004    $126,989,866    $126,989,866    $219,524,851    $219,588,389    26.6%
Permira V, L.P.    2014    $268,997,778    $273,110,573    $606,345,087    $743,847,737    20.4%
Silver Lake Partners III, L.P.    2007    $480,000,000    $612,624,572    $1,158,663,796    $1,190,178,688    18.5%
Silver Lake Partners IV, L.P.    2013    $320,000,000    $379,142,736    $656,101,118    $1,004,188,537    20.7%
Silver Lake Technology Investors IV, LP    2013    $80,000,000    $86,592,327    $189,094,888    $289,920,166    27.2%
Trident VI    2014    $250,000,000    $269,623,677    $641,117,338    $746,957,259    22.1%
Welsh, Carson, Anderson & Stowe XII, L.P.    2015    $350,000,000    $350,162,050    $723,731,408    $886,851,218    25.5%"""

def parse_money(s):
    if not s or s == '$0':
        return 0
    return float(s.replace('$', '').replace(',', ''))

def parse_percent(s):
    if not s or 'N/M' in s:
        return None
    return float(s.replace('%', '').strip())

funds = []
for line in raw_data.strip().split('\n'):
    # Split by multiple spaces (4+)
    parts = re.split(r'\s{4,}', line)

    if len(parts) < 7:
        continue

    try:
        fund_name = parts[0].strip()
        vintage = int(parts[1].strip())
        capital_committed = parse_money(parts[2].strip())
        cash_in = parse_money(parts[3].strip())
        cash_out = parse_money(parts[4].strip())
        remaining_value = parse_money(parts[5].strip())
        irr_str = parts[6].strip()

        # Calculate TVPI (Investment Multiple)
        if cash_in > 0:
            multiple = remaining_value / cash_in
        else:
            continue

        # Skip extreme outliers or zero values
        if multiple == 0 or multiple > 50:
            continue

        irr = parse_percent(irr_str)

        fund = {
            'fundName': fund_name,
            'vintage': vintage,
            'size': capital_committed / 1_000_000,  # Convert to millions
            'multiple': round(multiple, 2),
            'irr': irr
        }

        funds.append(fund)
    except Exception as e:
        print(f"Error parsing: {line}", file=__import__('sys').stderr)
        continue

# Sort by multiple descending
funds.sort(key=lambda x: x['multiple'], reverse=True)

# Generate TypeScript output
print(f"// CalPERS PE Funds (as of March 31, 2025) - Top {len(funds)} funds by TVPI\n")

for fund in funds:
    irr_part = f",\n    irr: {fund['irr']}" if fund['irr'] is not None else ""

    print(f"""  {{
    displayName: "{fund['fundName']} ({fund['vintage']}) - {fund['multiple']:.2f}x",
    fundName: "{fund['fundName']}",
    vintage: {fund['vintage']},
    strategy: "Private Equity",
    source: "CalPERS",
    sourceUrl: "https://www.calpers.ca.gov/investments/about-investment-office/investment-organization/pep-fund-performance-print",
    size: {fund['size']:.1f},
    grossReturnMultiple: {fund['multiple']:.2f}{irr_part},
  }},""")
