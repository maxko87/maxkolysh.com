// Script to parse CalPERS PE fund data and output TypeScript format
const rawData = `2024 Golden Bay, L.P.    2025    $100,000,000    $24,096,354    $0    $24,094,625    N/M 1    1
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
AMZL, LP    2023    $600,000,000    $223,965,507    $0    $160,434,913    N/M 1    1
Apollo European Principal Finance Fund, L.P.    2008    $89,556,629    $165,281,284    $200,770,615    $200,879,291    11.9%
Apollo Investment Fund IV, L.P.    1998    $150,000,000    $154,085,315    $254,289,011    $254,328,456    8.5%
Apollo Investment Fund IX, L.P    2019    $550,000,000    $535,168,083    $298,393,564    $833,711,337    17.2%
Apollo Investment Fund VI, L.P.    2006    $520,000,000    $866,357,105    $1,218,417,644    $1,227,258,867    8.2%
Apollo Investment Fund VIII, L.P.    2013    $350,000,000    $497,808,561    $621,414,810    $711,071,870    8.8%
Apollo Investment Fund X, L.P.    2023    $225,000,000    $81,065,209    $14,009,522    $94,257,991    N/M 1    1
Apollo Special Opportunities Managed Account, L.P.    2007    $800,000,000    $800,000,000    $1,092,675,222    $1,098,408,005    3.8%
ArcLight Energy Partners Fund III, L.P.    2006    $200,000,000    $212,312,180    $314,980,433    $314,980,433    8.6%
ArcLight Energy Partners Fund IV, L.P.    2007    $250,000,000    $255,794,752    $388,365,992    $388,847,672    12.6%
Ares Corporate Opportunities Fund III, L.P.    2008    $400,000,000    $512,078,628    $1,059,418,691    $1,060,579,822    20.2%
Ares Corporate Opportunities Fund V, L.P.    2017    $425,000,000    $477,162,390    $218,196,668    $605,101,309    5.7%
Ares Corporate Opportunities Fund VI, L.P.    2021    $250,000,000    $288,224,168    $102,871,301    $399,663,898    16.2% 1    1
Arlington Capital Partners VI, L.P.    2023    $300,000,000    $200,318,427    $10,210,739    $230,880,425    N/M 1    1
Arsenal Capital Partners Growth LP    2022    $50,000,000    $21,660,662    $32,924    $14,547,783    -22.7% 1    1
Arsenal Capital Partners VI LP    2022    $150,000,000    $82,922,167    $1,592,744    $64,710,669    -15.7% 1    1
ASF VIII B L.P.    2020    $300,000,000    $239,832,449    $76,465,522    $333,290,814    14.3%
Asia Alternatives Capital Partners II LP    2008    $48,933,451    $50,415,824    $124,168,845    $126,632,941    16.7%
Asia Alternatives Capital Partners, LP    2007    $50,000,000    $53,499,274    $94,501,174    $95,688,228    11.0%
B Capital Ascent Fund III, L.P.    2024    $94,151,346    $8,950,513    $7,324    $11,803,531    N/M 1    1
B Capital Global Growth III, L.P.    2023    $67,500,000    $51,123,943    $2,446,753    $57,228,235    N/M 1    1
B Capital Opportunities Fund II, L.P.    2024    $240,000,000    $19,541,878    $0    $36,220,008    N/M 1    1
Bain Capital Asia Fund V, L.P.    2023    $300,000,000    $117,390,237    $14,181,591    $144,459,015    N/M 1    1
Bain Capital Europe Fund VI, SCSp    2023    $161,795,813    $58,501,688    $0    $65,592,072    N/M 1    1
Bain Capital Insurance Fund, L.P.    2023    $125,000,000    $61,100,636    $8,192,494    $79,981,966    N/M 1    1
Bain Capital Life Sciences Fund IV, L.P.    2024    $100,000,000    $5,000,000    $0    $2,626    N/M 1    1
Bain Capital Tech Opportunities Fund II, L.P.    2023    $150,000,000    $85,094,837    $4,692,746    $104,255,596    N/M 1    1
Bain Capital Venture Coinvestment Fund IV, L.P.    2023    $150,000,000    $76,875,000    $0    $83,969,568    N/M 1    1
Bain Capital Venture Fund 2022, L.P.    2023    $150,000,000    $69,385,572    $0    $88,102,019    N/M 1    1
Balderton Capital Growth II, S.L.P.    2024    $63,000,000    $17,830,672    $0    $17,077,176    N/M 1    1
Balderton Capital IX, S.L.P.    2024    $56,000,000    $11,119,727    $0    $9,791,060    N/M 1    1
Baring Vostok Private Equity Fund IV L.P. / Supplemental    2007    $77,775,000    $91,865,849    $99,394,006    $100,101,973    1.6%
Base10 Partners III, L.P.    2022    $50,000,000    $28,401,593    $0    $27,616,392    -1.7% 1    1
Base10 Series B I, L.P.    2023    $50,000,000    $24,449,999    $0    $22,680,253    N/M 1    1
Bay State Partners, L.P.    2022    $157,955,774    $146,395,291    $0    $184,262,039    14.3% 1    1
BC CLP INVESTORS, L.P.    2023    $1,700,000,000    $1,043,513,785    $5,290,955    $1,227,642,057    N/M 1    1
BDC III C LP    2017    $130,986,772    $120,201,932    $297,171,348    $417,967,969    38.4%
BDC IV D LP    2021    $202,184,418    $164,515,998    $0    $185,650,505    6.6% 1    1
BE VI 'H' L.P.    2019    $391,853,875    $376,217,628    $128,765,859    $649,073,639    16.3%
Bear Coast (CV) Fund, LP    2023    $300,000,000    $191,000,000    $0    $248,603,514    N/M 1    1
Bear Coast (Ventures) Fund, LP    2023    $650,000,000    $641,733,302    $0    $727,199,910    N/M 1    1
Bear Technology Fund, L.P.    2021    $100,000,000    $95,495,070    $0    $81,099,895    -6.2% 1    1
Berkshire Fund X, L.P.    2021    $305,107,189    $396,185,515    $166,670,688    $436,848,772    6.6% 1    1
Bessemer Venture Partners XII Institutional L.P.    2024    $115,000,000    $21,054,195    $0    $18,901,761    N/M 1    1
Biogeneration Capital Fund V Cooperatief U.A.    2023    $21,535,859    $6,306,732    $0    $7,548,599    N/M 1    1
Birch Hill Equity Partners (US) III, LP    2005    $126,829,933    $142,696,482    $271,382,079    $271,382,079    12.1%
Birch Hill Equity Partners (US) IV, LP    2011    $136,518,885    $132,114,065    $290,921,619    $356,085,954    15.7%
BjorkTree AB    2024    $107,362,442    $20,997,752    $0    $24,053,442    N/M 1    1
Blackstone Capital Partners V L.P.    2006    $38,400,000    $794,822,847    $1,222,737,110    $1,222,737,110    7.8%
Blackstone Capital Partners VI L.P.    2011    $375,000,000    $544,078,975    $887,670,171    $977,898,016    12.4%
Blackstone Capital Partners VII, L.P.    2016    $375,000,000    $534,136,336    $623,246,616    $943,459,953    15.5%
Blackstone Capital Partners VIII, L.P.    2021    $262,500,000    $421,774,898    $276,860,548    $518,951,902    13.5% 1    1
Blackstone Communications Partners I L.P.    2000    $100,000,000    $111,242,017    $136,083,476    $136,114,881    6.5%
Blackstone Core Equity Partners II, L.P.    2021    $1,000,000,000    $452,202,883    $56,265,908    $608,881,497    13.5% 1    1
Blackstone Tactical Opportunities Fund - C L.P.    2012    $800,000,000    $993,830,907    $1,328,748,581    $1,349,495,608    9.4%
Blackstone Tactical Opportunities Fund II - C L.P.    2015    $500,000,000    $497,320,314    $655,270,749    $747,092,889    12.7%
Blackstone Tactical Opportunities Fund III-C (Surge) L.P.    2019    $500,000,000    $492,588,724    $181,213,550    $711,842,829    13.7%
Blackstone Tactical Opportunities Fund III-C L.P.    2018    $175,000,000    $360,222,792    $315,953,969    $472,061,283    11.7%
Blackwell Capital Partners, LP    2023    $1,620,093,396    $711,303,155    $2,354,607    $873,594,984    N/M 1    1
BOND III, LP    2022    $75,000,000    $35,100,000    $0    $33,808,334    -3.9% 1    1
Bridgepoint Europe III 'C' L.P.    2015    $25,889,019    $16,760,648    $18,955,256    $19,910,000    4.1%
Bridgepoint Europe III 'D' LP    2005    $194,303,235    $191,932,333    $228,563,948    $234,246,598    2.4%
Bridgepoint Europe IV 'B' L.P.    2015    $82,859,439    $67,960,669    $84,601,533    $94,399,994    11.9%
Bridgepoint Europe IV 'D' LP    2008    $388,491,990    $391,605,384    $567,693,618    $604,899,870    9.3%
Bridgepoint Europe VII D LP    2024    $97,795,504    $57,699,866    $0    $62,061,642    N/M 1    1
BRV Lotus Fund III, L.P.    2022    $100,000,000    $101,419,619    $6,539,874    $113,450,245    4.4% 1    1
Butterfly II, LP    2022    $125,000,000    $84,475,183    $27,021,240    $107,457,649    13.8% 1    1
BVP Forge Institutional L.P.    2023    $35,000,000    $17,810,745    $0    $20,923,559    N/M 1    1
CA Co-Investment Limited Partnership    2022    $1,950,000,000    $622,469,590    $0    $824,630,107    13.9% 1    1
CA1 SPV, L.P.    2023    $1,200,000,000    $896,584,367    $0    $1,065,719,347    N/M 1    1
California Asia Investors, L.P.    2008    $150,000,000    $149,713,894    $626,729,398    $633,307,795    26.5%
California Community Venture Fund, LLC    2003    $100,000,000    $100,067,655    $88,478,382    $91,378,427    -1.5%
California Emerging Ventures IV, LLC    2006    $463,114,266    $489,248,728    $871,828,508    $912,036,569    11.7%
California Partners, L.P.    2020    $850,000,000    $592,164,364    $27,218,275    $809,482,174    15.4%
CalPERS Clean Energy & Technology Fund, LLC    2007    $465,000,000    $468,423,814    $132,249,749    $138,045,373    -18.7%
CalPERS Corporate Partners, LLC    2001    $500,000,000    $533,507,990    $831,997,162    $831,997,403    9.3%
CalPERS Wellspring V, L.P.    2011    $24,975,000    $27,004,887    $47,927,588    $53,744,809    21.4%
Canaan Gold Coast L.P.    2023    $235,000,000    $71,231,250    $0    $73,556,146    N/M 1    1
Canaan XIII Healthcare Fund L.P.    2024    $37,083,465    $1,668,756    $0    $985,220    N/M 1    1
Canaan XIII L.P.    2024    $205,000,000    $24,600,000    $200,000    $22,103,139    N/M 1    1
Cap Co-Invest LP    2025    $100,000,000    $12,970,000    $0    $12,993,955    N/M 1    1
Capital Link Fund I, LLC    2007    $502,300,000    $600,774,708    $865,957,934    $900,125,487    7.6%
Capital Link Fund II, LLC    2008    $435,600,000    $472,710,927    $784,419,220    $795,511,085    11.9%
CapVest Equity Partners V SCSp    2023    $323,727,173    $71,810,319    $0    $105,237,767    N/M 1    1
Carlyle Asia Growth Partners III, L.P.    2005    $75,000,000    $84,766,869    $78,177,512    $78,177,512    -1.4%
Carlyle Asia Partners III, L.P.    2008    $150,000,000    $371,700,862    $584,513,151    $584,513,151    12.0%
Carlyle Asia Partners V, L.P.    2018    $125,000,000    $222,315,337    $175,924,155    $297,839,127    16.8%
Carlyle Europe Partners II, L.P.    2003    $46,224,744    $93,186,079    $149,009,090    $149,091,879    19.7%
Carlyle Europe Partners III, L.P.    2007    $258,240,491    $460,698,733    $742,254,678    $743,072,332    11.1%
Carlyle Europe Partners V, S.C.Sp.    2019    $173,755,123    $285,190,212    $199,194,575    $321,781,552    5.6%
Carlyle Partners V, L.P.    2007    $800,000,000    $1,067,512,609    $1,725,940,265    $1,752,117,213    12.8%
Carlyle Partners VI, L.P.    2013    $300,850,000    $597,079,518    $1,116,736,427    $1,188,180,318    15.9%
Carlyle Partners VII, L.P.    2018    $300,000,000    $605,512,059    $551,899,667    $888,114,051    13.3%
Carlyle Partners VIII, L.P.    2022    $177,206,640    $220,568,032    $149,279,988    $261,264,794    11.7% 1    1
Carlyle Strategic Partners IV, L.P.    2016    $150,000,000    $219,267,579    $138,226,783    $244,190,930    4.5%
Carlyle U.S. Equity Opportunities II, L.P.    2015    $200,000,000    $222,356,578    $311,741,225    $411,869,481    15.6%
CDH Fund V, L.P.    2014    $200,000,000    $229,896,804    $274,431,787    $335,833,710    8.0%
Cedar Street Partners LP    2021    $1,000,000,000    $290,576,015    $11,376,450    $608,300,181    38.2% 1    1
Centerbridge Capital Partners III, L.P.    2015    $150,000,000    $201,784,363    $221,618,330    $327,248,896    14.1%
Cerberus CAL II Partners, L.P.    2017    $500,000,000    $423,762,376    $644,747,968    $1,115,626,868    22.0%
Cerberus CAL III Partners, L.P.    2019    $500,000,000    $480,956,761    $42,879,804    $403,646,291    -4.9%
Cerberus CP Partners LP    2013    $570,297,030    $674,624,184    $1,096,816,667    $1,563,221,390    17.0%
Cerberus Institutional Partners V, L.P.    2012    $400,000,000    $479,288,769    $767,521,291    $938,394,158    13.9%
Cerberus Supply Chain Fund, L.P.    2023    $200,000,000    $70,598,867    $-1,007,842    $89,842,329    N/M 1    1
CF24XB SCSp    2025    $30,906,908    $24,725,526    $0    $24,725,526    N/M 1    1
China Privatization Fund (Del), L.P.    2006    $100,000,000    $69,317,995    $133,415,962    $133,415,962    13.7%
Clayton, Dubilier & Rice Fund X, L.P.    2018    $150,000,000    $161,652,863    $246,730,671    $379,179,736    30.9%
Clayton, Dubilier & Rice Fund XI, L.P.    2021    $142,271,997    $428,742,377    $331,034,663    $464,128,562    3.3% 1    1
Clayton, Dubilier & Rice Fund XII, L.P.    2024    $500,000,000    $143,587,746    $18,714,393    $192,462,912    N/M 1    1
Clearlake Capital Partners III, LP    2012    $50,000,000    $70,740,191    $202,099,514    $203,947,082    40.7%
Clearlake Capital Partners IV, L.P.    2015    $56,700,000    $88,850,635    $146,491,947    $182,049,769    27.7%
Clearlake Capital Partners V, L.P.    2018    $75,000,000    $112,539,514    $155,387,066    $230,006,819    34.3%
Clearlake Capital Partners VII, L.P.    2022    $350,000,000    $233,170,908    $941,316    $254,548,145    4.0% 1    1
Clearlake Opportunities Partners (P), L.P.    2015    $56,700,000    $84,456,937    $61,392,999    $109,825,706    7.7%
Clearwater Capital Partners Fund III, L.P.    2006    $150,000,000    $150,000,000    $155,531,855    $166,831,034    1.6%
Coalesce Capital Fund I, L.P.    2024    $150,000,000    $26,616,684    $0    $22,524,525    N/M 1    1
Coastal Pacific Partners, L.P.    2023    $136,249,880    $90,259,743    $0    $96,680,855    N/M 1    1
Cobalt Investment Fund, L.P.    2024    $100,000,000    $278,860    $0    $278,860    N/M 1    1
Coefficient Capital Apex Fund I, LP    2023    $83,726,563    $27,659,416    $0    $23,438,404    N/M 1    1
Coefficient Capital Fund II, LP    2024    $81,812,500    $6,339,321    $0    $5,086,073    N/M 1    1
Crosspoint Capital Fund II, LP    2023    $300,000,000    $186,942,734    $416,541    $214,721,460    N/M 1    1
CV Consortio Fund L.P.    2023    $750,000,000    $630,513,124    $0    $1,199,605,164    N/M 1    1
CVC Capital Partners Asia V L.P.    2020    $200,000,000    $192,940,870    $26,473,199    $261,542,226    12.8%
CVC Capital Partners Asia VI (A) L.P.    2024    $300,000,000    $44,715,089    $3,183,675    $43,726,503    N/M 1    1
CVC Capital Partners IX (A) L.P.    2024    $505,451,116    $76,377,243    $5,554    $76,471,542    N/M 1    1
CVC Capital Partners Strategic Opportunities Compounding Capital L.P.    2017    $1,002,540,716    $1,069,448,175    $595,774,599    $1,945,912,390    11.6%
CVC Capital Partners VI, L.P.    2014    $576,278,152    $682,364,607    $932,055,371    $1,339,677,140    15.5%
CVC Capital Partners VII (A) L.P.    2018    $451,865,023    $585,098,356    $587,359,436    $1,159,111,227    19.8%
CVC Capital Partners VIII (A) L.P.    2021    $492,565,361    $765,698,037    $331,674,236    $862,888,760    6.3% 1    1
CVC European Equity Partners III LP    2001    $200,000,000    $234,497,567    $595,574,634    $608,904,117    41.0%
CVC European Equity Partners IV (D) L.P.    2005    $332,210,348    $406,865,452    $726,781,649    $727,168,136    17.2%
CVC European Equity Partners V (B) L.P.    2008    $573,201,207    $710,667,384    $1,290,077,106    $1,302,439,851    16.4%
DS Opportunities (C) LP    2021    $487,923,371    $229,880,725    $0    $411,933,854    31.7% 1    1
EII-C SPV, LP    2024    $95,000,000    $65,243,109    $0    $73,751,994    N/M 1    1
EMAlternatives Investments, L.P.    2007    $100,000,000    $117,351,233    $127,720,593    $138,221,449    3.2%
Ember Infrastructure Fund II-B, LP    2024    $100,000,000    $35,154,864    $578,587    $36,077,574    N/M 1    1
EQT IX (No.2) USD SCSp    2021    $655,495,509    $821,365,120    $247,751,535    $1,034,255,645    8.3% 1    1
EQT X (No.2) USD SCSp    2022    $500,000,000    $175,592,075    $11,648,082    $185,344,531    6.8% 1    1
Equip Opportunities Fund, L.P.    2023    $140,000,000    $35,876,443    $0    $35,680,573    N/M 1    1
First Reserve Fund XI, L.P.    2006    $500,000,000    $570,151,741    $390,767,883    $390,767,883    -9.5%
First Reserve Fund XIII, LP    2014    $400,000,000    $480,466,567    $279,533,758    $445,262,254    -1.9%
Forbion BioEconomy Fund I Co?peratief U.A.    2024    $37,782,182    $6,802,599    $0    $6,112,055    N/M 1    1
Forbion Growth Opportunities Fund II Cooperatief U.A.    2023    $16,763,664    $9,399,185    $9,517,541    $15,439,709    N/M 1    1
Forbion Growth Opportunities Fund III Co?peratief U.A.    2024    $360,943,604    $20,585,243    $1,447,269    $13,326,024    N/M 1    1
Forbion Ventures Fund VI Cooperatief U.A.    2023    $173,104,899    $65,383,599    $22,280,690    $87,590,562    N/M 1    1
Forbion Ventures Fund VII Co?peratief U.A.    2024    $255,729,355    $14,825,407    $183,920    $12,574,777    N/M 1    1
ForCal I Investment Fund C.V.    2023    $323,073,190    $189,149,907    $0    $256,339,269    N/M 1    1
Forecastle, L.P.    2020    $790,000,000    $754,660,318    $7,657,726    $1,097,380,809    18.1%
Fourth Street Partners - CPS L.P.    2021    $500,000,000    $450,365,526    $72,974,016    $700,691,455    14.9% 1    1
Francisco Partners Agility II, L.P.    2020    $50,000,000    $41,800,000    $7,600,000    $88,435,088    30.4%
Francisco Partners Agility III, L.P.    2025    $100,000,000    $2,100,000    $0    $2,144,452    N/M 1    1
Francisco Partners II, L.P.    2006    $175,000,000    $174,005,517    $286,882,216    $287,616,044    10.4%
Francisco Partners III, L.P.    2011    $100,000,000    $95,284,663    $294,444,853    $325,185,091    22.9%
Francisco Partners VI, L.P.    2021    $250,000,000    $241,000,000    $41,728,571    $344,085,528    14.3% 1    1
Francisco Partners VII, L.P.    2023    $450,000,000    $82,800,000    $0    $87,809,108    N/M 1    1
FSP LR, L.P.    2024    $10,000,000    $311,850    $0    $25,893    N/M 1    1
GA Continuity II (GT) Fund, L.P.    2025    $31,619,538    $27,842,330    $0    $33,124,471    N/M 1    1
Gaia Investments, S.L.P.    2024    $60,000,000    $25,314,050    $0    $25,010,268    N/M 1    1
GC Customer Value Fund II, L.P.    2023    $280,494,000    $144,359,702    $8,346,497    $169,810,534    N/M 1    1
GCM Grosvenor DEM II, L.P.    2014    $250,000,000    $268,182,292    $271,273,235    $464,241,184    14.9%
GCM Grosvenor DEM III, L.P.    2019    $550,000,000    $526,212,160    $239,646,896    $888,585,352    21.7%
GCM Grosvenor DEM, L.P.    2012    $100,000,000    $116,295,933    $131,598,823    $160,039,724    8.7%
GCM Grosvenor Elevate Fund, L.P.    2023    $500,000,000    $50,246,171    $4,235,857    $44,452,004    N/M 1    1
General Atlantic Managed Account    2020    $1,050,000,000    $848,532,862    $86,559,596    $1,028,096,280    7.0%
General Catalyst Group XI - Health Assurance, L.P.    2023    $200,000,000    $165,511,703    $0    $195,819,357    N/M 1    1
General Catalyst Group XII - Creation, L.P.    2024    $200,000,000    $93,773,603    $242,490    $121,051,368    N/M 1    1
General Catalyst Group XII - Endurance, L.P.    2024    $293,500,000    $173,565,835    $33,867    $172,343,762    N/M 1    1
General Catalyst Group XII - Health Assurance, L.P.    2024    $100,000,000    $42,206,028    $4,358    $38,992,637    N/M 1    1
General Catalyst Group XII - Ignition, L.P.    2024    $200,000,000    $80,475,547    $148,420    $81,125,337    N/M 1    1
Genstar Capital Partners X, L.P.    2021    $100,000,000    $98,786,033    $3,728,953    $108,321,664    4.3% 1    1
Genstar Capital Partners XI, L.P.    2023    $200,000,000    $25,315,796    $2,314,438    $27,532,083    N/M 1    1
Genstar X Opportunities Fund I, L.P.    2021    $150,000,000    $133,549,845    $7,044,774    $161,868,062    8.4% 1    1
Genstar XI Opportunities Fund I, L.P.    2023    $200,000,000    $61,537,009    $2,329,405    $71,669,168    N/M 1    1
GI Data Infrastructure Fund II LP    2024    $150,000,000    $37,578,441    $0    $40,243,665    N/M 1    1
GIM LTE Hazel L.P.    2024    $215,000,000    $203,850,000    $0    $257,346,012    N/M 1    1
Gold Hills Partners, L.P.    2024    $400,000,000    $311,723,361    $9,264,486    $378,680,889    N/M 1    1
Gorseway Park PE, L.P.    2024    $225,000,000    $192,601,672    $0    $200,720,662    N/M 1    1
Grain Communications Opportunity Fund IV-A, L.P.    2023    $200,000,000    $55,025,583    $1,181,403    $50,404,872    N/M 1    1
Grandval II, L.P.    2019    $1,050,000,000    $833,018,804    $159,053,804    $1,314,970,504    15.0%
Grandval, L.P.    2018    $50,000,000    $49,824,644    $15,027,711    $95,408,819    17.9%
GranTain Co-Invest L.P.    2021    $350,000,000    $184,573,781    $8,960,614    $217,188,878    7.9% 1    1
GreatPoint Opportunity Fund I, L.P.    2024    $100,000,000    $85,141,851    $0    $94,448,076    N/M 1    1
Green Equity Investors CF II, L.P.    2021    $60,537,375    $60,708,143    $0    $97,568,580    15.6% 1    1
Green Equity Investors CF, L.P.    2021    $186,639,450    $183,055,172    $113,710,240    $244,854,578    12.8% 1    1
Green Equity Investors IX, L.P.    2023    $500,000,000    $270,950,570    $7,028,796    $304,727,683    N/M 1    1
Green Equity Investors V, L.P.    2007    $400,000,000    $445,789,540    $1,023,767,776    $1,024,430,914    18.4%
Green Equity Investors VIII, L.P.    2020    $376,206,440    $569,296,808    $314,117,514    $791,283,758    10.6%
Greenbriar Equity Fund VI, L.P.    2023    $95,000,000    $35,171,668    $6,770    $40,384,055    N/M 1    1
Greenleaf Co-Invest Partners, L.P.    2021    $975,000,000    $473,896,050    $8,725,142    $795,994,584    17.1% 1    1
Griffin Gaming Partners III, L.P.    2025    $50,000,000    $10,000,000    $0    $8,444,710    N/M 1    1
GSC I, L.P.    2024    $400,000,000    $348,193,495    $0    $375,087,479    N/M 1    1
GSO Energy Partners-C II LP    2016    $250,000,000    $231,488,063    $293,790,453    $300,877,558    8.2%
GSO Energy Partners-C LP    2013    $400,000,000    $477,051,098    $404,463,379    $418,511,958    -3.1%
H.I.G. Europe Middle Market LBO Fund, L.P.    2021    $107,495,381    $69,115,036    $24,502,837    $92,172,796    20.0% 1    1
Healthcare and Fintech, L.P.    2022    $200,000,000    $149,203,345    $0    $238,010,814    40.5% 1    1
Hedosophia Partners VI L.P.    2024    $60,000,000    $29,999,996    $0    $30,773,381    N/M 1    1
Hedosophia Strategic Partners L.P.    2024    $14,134,615    $5,306,369    $0    $4,984,252    N/M 1    1
Hellman & Friedman Capital Partners IX, L.P.    2020    $578,721,883    $712,503,206    $219,549,643    $1,131,793,937    13.1%
Hellman & Friedman Capital Partners VII    2011    $300,000,000    $286,896,670    $945,792,700    $969,940,867    24.6%
Hellman & Friedman Capital Partners VIII, L.P.    2016    $500,000,000    $518,442,042    $343,190,310    $897,904,555    10.9%
Hellman & Friedman Capital Partners X, L.P.    2021    $940,007,767    $853,071,498    $152,997,012    $990,960,524    6.2% 1    1
Hg Genesis 10 A L.P.    2023    $134,767,378    $34,938,246    $0    $39,805,491    N/M 1    1
Hg Mercury 4 A L.P.    2023    $53,844,321    $14,428,655    $0    $16,421,133    N/M 1    1
Hg Saturn 3 A L.P.    2023    $150,000,000    $81,947,942    $0    $96,978,391    N/M 1    1
HongShan Capital Expansion Fund I, L.P.    2024    $134,000,000    $20,770,000    $0    $19,688,226    N/M 1    1
HongShan Capital Growth Fund VII, L.P.    2023    $104,000,000    $23,955,105    $0    $19,409,217    N/M 1    1
HongShan Capital Seed Fund III, L.P.    2022    $12,000,000    $4,804,613    $0    $4,079,519    -11.1% 1    1
HongShan Capital Venture Fund IX, L.P.    2022    $32,000,000    $9,783,674    $0    $8,463,587    -11.2% 1    1
Hornet Co-Invest, L.P.    2024    $800,000,000    $466,813,026    $0    $632,445,450    N/M 1    1
Innovation Opportunities, L.P.    2023    $1,668,568,667    $862,470,158    $0    $1,508,221,002    N/M 1    1
Insight Partners XI, L.P.    2020    $400,000,000    $389,200,000    $19,111,580    $650,379,778    13.0%
Insight Partners XII Buyout Annex Fund, L.P.    2021    $150,000,000    $136,980,208    $0    $174,092,246    9.5% 1    1
Insight Partners XII, L.P.    2021    $600,000,000    $552,929,570    $663,047    $568,405,385    1.1% 1    1
Insight Partners XIII Growth Buyout Fund, L.P.    2024    $100,000,000    $17,000,000    $25,474    $17,732,034    N/M 1    1
Insight Partners XIII, L.P.    2024    $300,000,000    $33,717,508    $27,042    $32,550,448    N/M 1    1
Insight Venture Partners Growth-Buyout Coinvestment Fund (B), L.P.    2015    $400,000,000    $433,400,000    $950,221,432    $1,539,567,005    26.3%
Insight Venture Partners IX, L.P.    2015    $100,000,000    $105,668,637    $232,182,263    $414,292,168    23.4%
Insight Venture Partners X, L.P.    2018    $250,000,000    $261,808,718    $246,946,063    $734,041,852    23.0%
Jade Equity Investors II, L.P.    2024    $150,000,000    $55,295,097    $0    $61,443,492    N/M 1    1
Jade Equity Investors, L.P.    2020    $155,000,000    $160,469,431    $75,757,393    $243,532,263    19.4%
JSC Capital Partners, L.P.    2024    $1,074,312,232    $1,021,411,960    $0    $1,228,813,388    N/M 1    1
K5 Private Investors, L.P.    2021    $150,000,000    $107,384,157    $5,985,446    $148,972,823    14.0% 1    1
Khosla Ventures III, L.P.    2009    $200,000,000    $200,000,000    $362,846,119    $369,852,660    9.7%
Khosla Ventures Seed, L.P.    2009    $60,000,000    $60,000,000    $12,484,329    $70,669,553    1.4%
KKR 2006 Fund L.P.    2006    $400,000,000    $595,407,506    $940,703,667    $940,703,667    8.2%
KKR Asian Fund II L.P.    2013    $350,000,000    $651,726,626    $608,267,498    $686,376,512    1.5%
KKR Asian Fund IV SCSp    2021    $300,000,000    $183,825,632    $29,894,919    $271,264,510    18.0% 1    1
KKR Asian Fund L.P.    2007    $272,575,591    $355,648,095    $601,148,863    $601,231,425    13.6%
KKR European Fund II, L.P.    2005    $202,984,339    $236,198,253    $295,151,012    $295,151,012    3.9%
KKR European Fund III, L.P.    2008    $317,268,225    $420,900,950    $590,797,902    $594,043,738    9.5%
KKR European Fund V (USD) SCSp    2020    $300,000,000    $290,507,396    $132,941,502    $405,859,132    10.7%
KKR North America Fund XIII SCSp    2022    $600,000,000    $452,194,576    $11,312,159    $554,095,696    12.2% 1    1
KM Corporate Partners Fund II, LP    2007    $200,000,000    $195,212,804    $238,176,799    $242,891,125    4.2%
KOALA PACIFIC PARTNERSHIP, L.P.    2024    $200,000,000    $150,425,662    $0    $184,438,050    N/M 1    1
Lightspeed Opportunity Fund II, LP    2022    $200,000,000    $192,000,000    $0    $260,550,934    22.9% 1    1
Lightspeed Opportunity Fund III, L.P.    2025    $200,000,000    $20,000,000    $0    $19,097,470    N/M 1    1
Lightspeed Venture Partners Select V, L.P.    2022    $100,000,000    $91,000,000    $0    $103,433,170    8.6% 1    1
Lightspeed Venture Partners Select VI, L.P.    2025    $100,000,000    $10,000,000    $0    $9,254,532    N/M 1    1
Lightspeed Venture Partners XIV-A (Inception), L.P.    2022    $45,000,000    $36,450,000    $0    $50,645,845    18.9% 1    1
Lightspeed Venture Partners XIV-B (Ignite), L.P.    2022    $55,000,000    $44,550,000    $0    $63,979,978    24.6% 1    1
Lightspeed Venture Partners XV-A (Inception), L.P.    2025    $45,000,000    $3,150,000    $0    $3,072,906    N/M 1    1
Lightspeed Venture Partners XV-B (Ignite), L.P.    2025    $55,000,000    $2,750,000    $0    $2,656,343    N/M 1    1
Lime Rock Partners IV, LP    2006    $43,000,000    $47,917,078    $139,501,029    $139,583,193    14.6%
Lincoln Plaza Fund, L.P.    2024    $2,000,000,000    $629,201,271    $2,184,116    $739,190,626    N/M 1    1
Lindsay Goldberg IV, L.P.    2015    $136,920,941    $220,269,212    $391,854,121    $440,305,433    28.9%
LongRange Capital Fund I, L.P.    2020    $1,500,000,000    $760,518,192    $135,980,032    $1,010,129,883    12.6%
LS Investments C, L.P.    2024    $650,000,000    $471,186,627    $0    $553,222,347    N/M 1    1
Lux Ventures VIII, L.P.    2023    $300,000,000    $118,500,000    $0    $167,550,439    N/M 1    1
Madison Dearborn Capital Partners V, L.P.    2006    $300,000,000    $351,612,894    $544,926,216    $544,926,216    7.5%
Magnolia Opportunities LLC    2023    $100,000,000    $23,099,500    $16,120,000    $22,991,275    N/M 1    1
Mayfield XVII, a Delaware Limited Partnership    2024    $21,000,000    $2,520,000    $0    $2,652,683    N/M 1    1
MBK Partners Fund VI, L.P.    2024    $250,000,000    $49,503,729    $134,737    $39,879,666    N/M 1    1
Middlefield Road Private Opportunities Fund, L.P.    2021    $800,000,000    $231,378,144    $0    $249,192,562    3.8% 1    1
Moreton Bay SPV, LP    2023    $1,350,000,000    $1,154,384,038    $0    $1,410,382,156    N/M 1    1
Muir Woods Partners, L.P.    2023    $250,000,000    $134,452,083    $0    $212,071,110    N/M 1    1
New Mountain CAS Continuation Fund, L.P.    2021    $90,723,142    $91,001,432    $24,840,552    $89,345,085    -0.8% 1    1
New Mountain Partners III, L.P.    2007    $400,000,000    $470,815,270    $1,054,284,551    $1,069,908,760    14.6%
New Mountain Partners VI, L.P.    2021    $289,700,324    $577,856,038    $374,647,936    $762,701,478    13.0% 1    1
New Mountain Partners VII, L.P.    2024    $250,000,000    $35,736,629    $0    $35,551,707    N/M 1    1
NM Pacific, L.P.    2021    $320,000,000    $299,394,526    $3,996,176    $361,972,819    8.2% 1    1
Nordic Bear SCSp    2021    $1,800,000,000    $1,619,284,048    $53,531,155    $2,004,225,549    11.5% 1    1
Oak HC/FT Partners V, L.P.    2022    $200,000,000    $97,128,085    $15,561,739    $106,533,031    10.9% 1    1
Oaktree Latigo Investment Fund, L.P.    2020    $1,000,000,000    $480,000,000    $312,900,000    $650,504,333    9.9%
Oaktree Opportunities Fund VIIIb, L.P.    2011    $200,000,000    $200,000,000    $325,474,146    $335,256,319    8.1%
OHA Black Bear Fund, L.P.    2020    $1,000,000,000    $260,000,000    $183,415,842    $390,298,392    11.5%
Onex Partners IV, L.P.    2014    $260,622,914    $329,577,280    $362,935,888    $456,116,648    6.9%
Onex Partners V-B LP    2018    $455,585,109    $481,826,963    $135,123,870    $691,488,712    10.0%
Orchard Park, L.P.    2023    $535,350,000    $447,398,083    $0    $556,975,830    N/M 1    1
Otro Capital Fund I-A, LP    2025    $50,000,000    $16,975,760    $0    $17,670,409    N/M 1    1
PAG Asia I LP    2012    $100,000,000    $122,564,884    $214,124,518    $222,497,440    17.3%
PAG Asia III LP    2019    $380,000,000    $383,025,285    $120,613,628    $491,540,840    8.1%
Palladium Equity Partners V, L.P.    2018    $75,000,000    $78,561,860    $51,261,235    $121,320,366    12.9%
Pantheon Global Secondary Fund VII Feeder (US) LP    2023    $200,000,000    $94,077,530    $0    $123,468,747    N/M 1    1
Patient Square Equity Partners, LP    2023    $300,000,000    $222,476,420    $1,827,337    $261,493,473    N/M 1    1
Patria Brazilian Private Equity Fund V, L.P.    2015    $150,000,000    $155,136,240    $47,749,770    $229,162,763    8.0%
Permira Europe III    2004    $126,989,866    $126,989,866    $219,524,851    $219,588,389    26.6%
Permira Growth Opportunities I L.P. 1    2019    $200,000,000    $205,266,438    $52,662,033    $265,045,770    8.0%
Permira Growth Opportunities II SCSP    2022    $155,000,000    $92,428,392    $6,433,550    $90,274,138    -1.3% 1    1
Permira IV L.P.2    2006    $287,129,045    $354,598,629    $500,719,955    $560,219,118    8.2%
Permira V, L.P.    2014    $268,997,778    $273,110,573    $606,345,087    $743,847,737    20.4%
Permira VI L.P. 1    2017    $497,808,812    $487,619,362    $494,052,774    $958,395,786    15.1%
Permira VII L.P.1    2020    $553,975,288    $610,823,219    $145,454,837    $753,227,627    6.2%
Permira VIII-2 SCSp    2023    $700,385,385    $406,017,487    $6,397,002    $456,338,768    N/M 1    1
Phoenix Bear Partners, L.P.    2023    $1,975,000,000    $1,554,903,015    $27,118,775    $1,940,440,795    N/M 1    1
Pioneer Pier Investments, L.P.    2024    $300,000,000    $13,280,731    $0    $14,259,486    N/M 1    1
Pophouse Fund (No. 1) SCS    2024    $106,600,297    $36,170,910    $97,852    $34,030,136    N/M 1    1
Pophouse Investment Platform SCA SICAV-RAIF ? Pophouse Co-Investment Fund II    2025    $37,023,064    $21,354,817    $0    $21,835,410    N/M 1    1
Project Quail Opportunities, L.P.    2022    $1,000,000,000    $386,326,977    $950,806    $547,882,665    21.0% 1    1
Prysm Capital Fund I, L.P.    2023    $100,000,000    $103,649,546    $0    $106,830,789    N/M 1    1
Prysm Capital Fund II-C, L.P.    2024    $200,000,000    $131,542,956    $0    $197,933,029    N/M 1    1
PSG Encore L.P.    2022    $100,000,000    $90,286,712    $2,211,496    $100,881,916    8.2% 1    1
PSG Europe II L.P.    2023    $108,027,676    $31,981,939    $2,071,947    $41,382,306    N/M 1    1
PSG V L.P.    2021    $100,000,000    $105,123,552    $9,911,846    $127,026,309    11.5% 1    1
Q-Street Capital, L.P.    2021    $400,000,000    $309,937,654    $0    $383,272,538    9.5% 1    1
RC CC Fund LP    2024    $750,000,000    $541,639,800    $0    $690,302,541    N/M 1    1
Red Admiral Fund LP    2023    $1,200,000,000    $348,864,146    $90,273,720    $581,491,722    N/M 1    1
Redwood Lane Capital, L.P.    2022    $700,000,000    $669,286,173    $0    $941,766,229    25.6% 1    1
Redwood Opportunities SCSp    2020    $950,000,000    $804,628,748    $2,998,580    $1,110,227,247    14.8%
River City Investments PCC    2024    $150,000,000    $25,800,000    $0    $25,669,049    N/M 1    1
Riverstone Global Energy and Power Fund V, L.P.    2012    $400,000,000    $530,971,147    $427,512,115    $436,323,464    -4.4%
Riverstone Global Energy and Power Fund VI, L.P.    2016    $500,000,000    $644,475,965    $493,621,268    $670,099,658    1.1%
Rubicon Partners SCSp    2023    $487,209,648    $217,164,676    $0    $265,933,012    N/M 1    1
Sacramento Private Equity Partners, L.P.    2006    $537,857,143    $527,013,573    $1,002,809,914    $1,044,781,993    11.6%
SAIF Partners III L.P.    2007    $100,000,000    $126,111,682    $156,212,437    $219,021,805    6.0%
SAIF Partners IV L.P.    2010    $120,000,000    $152,768,026    $122,992,113    $209,060,018    4.0%
Samson Partners, L.P.    2020    $238,801,883    $172,155,918    $22,795,314    $286,092,182    13.1%
Set Builders II, LP    2024    $70,000,000    $26,272,986    $0    $37,495,044    N/M 1    1
Shoreline, L.P.    2024    $200,000,000    $52,944,757    $0    $52,536,683    N/M 1    1
Sierra Partners, L.P.    2020    $150,000,000    $81,986,760    $21,284,053    $87,847,280    3.7%
SignalFire Early Fund IV, L.P.    2025    $80,252,308    $6,018,923    $0    $5,940,456    N/M 1    1
SignalFire Sage Fund, L.P.    2023    $100,000,000    $79,531,451    $0    $85,097,470    N/M 1    1
SignalFire Seed Fund V, L.P.    2024    $80,252,308    $5,216,400    $0    $4,412,578    N/M 1    1
SignalFire XIR Venture Fund II, L.P.    2024    $48,531,538    $6,794,415    $0    $5,770,557    N/M 1    1
Silver Lake Partners III, L.P.    2007    $480,000,000    $612,624,572    $1,158,663,796    $1,190,178,688    18.5%
Silver Lake Partners IV, L.P.    2013    $320,000,000    $379,142,736    $656,101,118    $1,004,188,537    20.7%
Silver Lake Partners V, L.P.    2018    $400,000,000    $408,888,666    $249,028,715    $644,571,894    11.5%
Silver Lake Partners VI, L.P.    2021    $755,236,302    $872,586,178    $188,771,976    $1,068,226,701    8.2% 1    1
Silver Lake Partners VII, L.P.    2024    $370,000,000    $116,703,777    $163,572    $136,482,503    N/M 1    1
Silver Lake Technology Investors IV, LP    2013    $80,000,000    $86,592,327    $189,094,888    $289,920,166    27.2%
Silver Lake Technology Investors V, L.P.    2018    $100,000,000    $94,369,969    $70,126,320    $175,299,500    14.6%
Siris Partners IV, L.P.    2019    $100,000,000    $113,406,161    $39,519,879    $148,929,117    8.3%
SL SPV-1, L.P.    2017    $38,675,166    $83,958,311    $98,591,777    $104,807,383    3.1%
SL SPV-2, L.P.    2019    $28,417,191    $50,424,679    $123,559,787    $177,945,520    28.4%
SPRINGBLUE A, L.P.    2021    $50,000,000    $35,125,000    $0    $27,554,251    -9.2% 1    1
Springblue A-V, L.P.    2024    $60,000,000    $15,300,000    $0    $16,561,419    N/M 1    1
SPRINGBLUE B, L.P.    2021    $50,000,000    $45,250,000    $0    $47,035,037    1.4% 1    1
Springblue B-III, L.P.    2023    $40,000,000    $10,200,000    $0    $13,738,652    N/M 1    1
Springblue Co-Investment SPV, LP    2023    $120,000,000    $26,466,050    $0    $53,280,352    N/M 1    1
SR One Capital Fund II-A, LP    2023    $90,000,000    $60,305,526    $2,243,225    $53,480,915    N/M 1    1
SR One Capital Opportunities Fund I, LP    2023    $72,351,563    $43,219,760    $193,624    $27,211,081    N/M 1    1
Summit Partners Growth Equity Fund X-A, L.P.    2020    $250,000,000    $242,132,332    $69,824,777    $359,317,672    13.6%
Summit Partners Growth Equity Fund XI-A, L.P.    2022    $400,000,000    $161,323,549    $1,629,711    $175,915,096    5.7% 1    1
Sunrise Boulevard PE Partners L.P.    2021    $500,000,000    $373,210,088    $757,910    $511,504,795    13.8% 1    1
TA Select Opportunities Fund II-A, L.P.    2021    $50,000,000    $49,125,000    $0    $50,475,907    1.6% 1    1
TA XIV-A, L.P.    2021    $150,000,000    $146,625,000    $5,250,000    $166,080,665    6.0% 1    1
TA XV-A, L.P.    2025    $300,000,000    $36,000,000    $0    $31,980,905    N/M 1    1
Tailwind Capital Partners II, LP    2014    $150,000,000    $166,309,208    $240,592,859    $244,670,100    9.6%
Tailwind Capital Partners III, L.P.    2018    $200,000,000    $221,880,517    $120,243,439    $358,006,669    17.5%
TCC Opportunities, L.P.    2021    $1,100,000,000    $829,586,908    $46,306,595    $1,072,153,394    21.5% 1    1
TCP II Co-Invest B, L.P.    2015    $50,000,000    $58,367,891    $96,898,326    $99,462,931    10.6%
TCV X, L.P.    2019    $156,592,057    $131,366,092    $87,500,375    $313,046,821    20.4%
TCV XI, L.P.    2021    $261,229,279    $257,507,701    $18,031,534    $259,911,187    0.4% 1    1
The Rise Fund (A), L.P.    2018    $75,000,000    $83,137,228    $50,761,832    $121,259,510    10.0%
The Rise Fund III, L.P.    2023    $100,000,000    $56,609,063    $1,035,467    $68,877,623    N/M 1    1
The Veritas Capital Fund IX, L.P.    2024    $400,000,000    $3,643,403    $1,229    $1,229    N/M 1    1
The Veritas Capital Fund VIII, L.P.    2022    $625,000,000    $513,217,824    $168,666    $632,117,798    13.6% 1    1
Thoma Bravo Europe Fund, L.P.    2025    $108,091,008    $36,774,777    $0    $41,270,197    N/M 1    1
Thoma Bravo Fund XIV, L.P.    2021    $600,000,000    $649,108,610    $148,655,099    $813,152,002    7.4% 1    1
Thoma Bravo Fund XV, L.P.    2022    $348,293,279    $479,913,662    $234,020,566    $613,161,939    12.5% 1    1
Thomas H. Lee Equity Fund VI, L.P    2006    $240,000,000    $402,954,172    $556,367,009    $556,367,009    7.0%
Three Pillars Flex Opportunities Fund, LP    2023    $500,000,000    $78,974,026    $0    $158,785,296    N/M 1    1
Three Pillars Secondaries Fund, LP    2024    $750,000,000    $99,375,000    $31,875,000    $174,154,283    N/M 1    1
Thrive Capital Partners IX Growth, L.P.    2024    $365,742,209    $153,443,494    $0    $185,228,650    N/M 1    1
Thrive Capital Partners Opportunity Fund, L.P.    2024    $179,000,000    $80,668,879    $0    $104,210,759    N/M 1    1
Thrive Capital Partners VIII Growth, L.P.    2023    $300,000,000    $296,645,794    $0    $489,280,031    N/M 1    1
Tiger Global Private Investment Partners XV, L.P.    2022    $300,000,000    $285,000,000    $0    $213,199,830    -9.7% 1    1
Timber Coast Private Opportunities, L.P.    2023    $300,000,000    $70,228,202    $0    $79,111,310    N/M 1    1
Top Castle Sidecar VII, L.P.    2020    $500,000,000    $144,751,179    $43,521,072    $242,328,265    26.3%
TowerBrook Investors IV (Onshore), L.P.    2013    $380,000,000    $317,936,716    $439,485,669    $650,360,551    17.3%
Towerbrook Investors V (Onshore) LP    2019    $400,000,000    $434,087,612    $84,527,012    $656,938,801    15.0%
Towerbrook Investors VI (Onshore), L.P.    2024    $100,000,000    $24,520,075    $84,448    $27,192,579    N/M 1    1
Towerbrook Structured Opportunities Fund (Onshore), L.P.    2016    $221,786,667    $296,219,920    $252,997,540    $375,077,597    7.1%
Towerbrook Structured Opportunities Fund II (Onshore) LP    2019    $250,000,000    $243,226,877    $155,541,221    $330,945,786    14.1%
TPG Asia V, L.P.    2007    $360,000,000    $350,599,460    $488,924,451    $502,227,565    6.3%
TPG Asia VIII (A), L.P.    2024    $250,000,000    $91,224,278    $0    $103,301,796    N/M 1    1
TPG Biotechnology Partners II, L.P.    2006    $70,000,000    $71,952,784    $86,914,132    $86,914,132    2.9%
TPG Biotechnology Partners III, L.P.    2008    $100,000,000    $100,076,482    $212,285,844    $217,330,712    11.0%
TPG Golden Bear Partners, L.P.    2019    $500,000,000    $489,403,401    $94,435,915    $857,078,843    16.5%
TPG GP Solutions (A), L.P.    2024    $100,000,000    $22,824,605    $0    $25,665,039    N/M 1    1
TPG Growth IV, L.P.    2018    $75,000,000    $84,025,753    $60,185,234    $140,982,213    14.7%
TPG Growth V, L.P.    2021    $200,000,000    $200,948,969    $42,235,637    $290,198,592    15.0% 1    1
TPG Growth VI, L.P.    2024    $200,000,000    $55,951,379    $14,103    $66,445,070    N/M 1    1
TPG Healthcare Partners, L.P.    2019    $100,000,000    $98,201,988    $27,862,432    $134,996,863    13.2%
TPG Life Sciences Innovations, L.P.    2024    $75,000,000    $22,017,062    $0    $15,525,928    N/M 1    1
TPG NEXT (A), L.P.    2025    $500,000,000    $2,255,097    $2,255,097    $2,255,097    N/M 1    1
TPG Partners IV, L.P.    2003    $200,000,000    $225,811,661    $428,892,245    $429,196,744    15.3%
TPG PARTNERS IX, L.P.    2023    $300,000,000    $158,232,893    $123,716    $188,978,799    N/M 1    1
TPG Partners V, L.P.    2006    $600,000,000    $811,329,685    $1,007,256,750    $1,007,256,750    3.7%
TPG Partners VIII, L.P.    2019    $150,000,000    $388,265,672    $352,941,144    $527,494,656    20.3%
TPG STAR, L.P.    2007    $150,000,000    $171,879,025    $219,538,523    $219,842,878    6.2%
TPG Tech Adjacencies II, L.P.    2023    $200,000,000    $122,627,541    $6,320,815    $146,211,110    N/M 1    1
Triangle Investment Opportunities II, L.P.    2024    $1,000,000,000    $70,335,857    $0    $71,300,122    N/M 1    1
Triangle Investment Opportunities, L.P.    2023    $1,000,000,000    $970,083,613    $69,741,593    $1,647,955,990    N/M 1    1
Trident IX, L.P.    2022    $500,000,000    $380,894,096    $48,924,768    $484,995,910    16.9% 1    1
Trident VI    2014    $250,000,000    $269,623,677    $641,117,338    $746,957,259    22.1%
Trident VII, L.P.    2017    $270,000,000    $323,622,568    $308,853,630    $717,588,497    18.8%
Trident VIII, L.P.    2020    $400,000,000    $396,447,703    $121,783,765    $624,671,465    13.4%
Triton Fund IV L.P.    2013    $92,215,402    $108,403,645    $112,077,959    $184,140,599    12.0%
Triton Fund V, LP    2019    $281,657,183    $273,484,225    $111,959,473    $425,146,694    15.9%
Valor Equity Partners IV L.P.    2017    $75,000,000    $74,484,349    $16,149,150    $231,976,752    20.6%
Valor Equity Partners VI L.P.    2023    $300,000,000    $206,789,782    $64,595    $297,006,156    N/M 1    1
Verdane Edda III (D1) AB    2024    $108,001,742    $33,329,164    $0    $37,960,687    N/M 1    1
Vicente Capital Partners Growth Equity Fund, L.P.    2007    $40,422,297    $40,801,085    $56,560,761    $56,953,097    5.7%
VIP IV LP    2020    $302,829,400    $285,066,983    $5,586,572    $358,156,457    9.2%
VIP V S.C.Sp.    2023    $324,284,363    $50,966,375    $1,890,592    $44,932,950    N/M 1    1
Vista Equity Partners Fund VII-Z, L.P.    2019    $400,000,000    $391,719,146    $42,412,855    $469,885,988    4.7%
WCAS XIII, L.P.    2019    $400,000,000    $383,241,237    $228,948,284    $635,037,834    16.0%
WCAS XIV, L.P.    2022    $400,000,000    $167,801,936    $0    $169,432,821    0.7% 1    1
Welsh, Carson, Anderson & Stowe XI, L.P.    2009    $125,000,000    $125,000,000    $207,650,933    $207,888,844    11.5%
Welsh, Carson, Anderson & Stowe XII, L.P.    2015    $350,000,000    $350,162,050    $723,731,408    $886,851,218    25.5%
Whitney Global Partners II L.P.    2024    $270,495,556    $141,628,259    $0    $151,704,034    N/M 1    1
Whitney Global Partners L.P.    2021    $805,439,953    $756,362,645    $493,241    $877,526,453    7.0% 1    1
Wigeavenmore Co-Investment LP    2024    $286,859,353    $179,429,651    $0    $241,780,855    N/M 1    1
Wigmore Street (BDC III) LP    2017    $32,748,137    $30,733,886    $68,253,967    $99,731,356    34.8%
Wigmore Street BDC IV Co-Investment No.1 LP    2021    $50,289,349    $50,060,469    $0    $54,981,765    5.8% 1    1
Wigmore Street Co-investment No. 1 LP    2016    $99,378,491    $93,696,159    $159,363,280    $198,867,950    21.3%
Wigmore Street VI Co-Investment No. 1 LP    2019    $98,915,459    $96,673,167    $34,342,616    $179,618,831    15.9%
Yucaipa American Alliance Fund II, L.P.    2008    $400,000,000    $560,638,831    $612,947,113    $929,461,978    7.4%
Yucaipa Corporate Initiatives Fund I, L.P.    2001    $200,000,000    $288,655,697    $222,325,508    $225,528,601    -3.7%
Yucaipa Corporate Initiatives Fund II, L.P.    2008    $93,539,524    $91,400,621    $81,687,571    $82,780,431    -1.3%`;

function parseMoney(str) {
  if (!str || str === '$0' || str === '0') return 0;
  return parseFloat(str.replace(/[$,]/g, ''));
}

function parsePercent(str) {
  if (!str || str === 'N/M' || str === 'N/M 1' || str.includes('N/M')) return null;
  return parseFloat(str.replace('%', ''));
}

const lines = rawData.trim().split('\n');
const funds = [];

for (const line of lines) {
  const parts = line.split(/\s{4,}/); // Split by 4+ spaces
  if (parts.length < 7) {
    // Try splitting by tabs
    const tabParts = line.split('\t');
    if (tabParts.length >= 7) {
      parseFundLine(tabParts);
    } else {
      console.error('Could not parse line:', line);
    }
  } else {
    parseFundLine(parts);
  }
}

function parseFundLine(parts) {
  try {
    const fundName = parts[0].trim();
    const vintage = parseInt(parts[1].trim());
    const capitalCommitted = parseMoney(parts[2].trim());
    const cashIn = parseMoney(parts[3].trim());
    const cashOut = parseMoney(parts[4].trim());
    const remainingValue = parseMoney(parts[5].trim());
    const irrStr = parts[6].trim();

    // Calculate investment multiple (TVPI)
    const multiple = cashIn > 0 ? remainingValue / cashIn : 0;

    // Skip funds with no meaningful data or extreme outliers
    if (cashIn === 0 || multiple === 0 || multiple > 50) return;

    // Parse IRR
    const irr = parsePercent(irrStr);

    const fund = {
      fundName,
      vintage,
      capitalCommitted: capitalCommitted / 1000000, // Convert to millions
      multiple: Math.round(multiple * 100) / 100,
      irr,
    };

    funds.push(fund);
  } catch (e) {
    console.error('Error parsing fund:', parts, e);
  }
}

// Sort by multiple descending
funds.sort((a, b) => b.multiple - a.multiple);

// Generate TypeScript code
const tsCode = funds.map(fund => {
  const irrPart = fund.irr !== null ? `,\n    irr: ${fund.irr}` : '';
  return `  {
    displayName: "${fund.fundName} (${fund.vintage}) - ${fund.multiple.toFixed(2)}x",
    fundName: "${fund.fundName}",
    vintage: ${fund.vintage},
    strategy: "Private Equity",
    source: "CalPERS",
    sourceUrl: "https://www.calpers.ca.gov/investments/about-investment-office/investment-organization/pep-fund-performance-print",
    size: ${fund.capitalCommitted.toFixed(1)},
    grossReturnMultiple: ${fund.multiple.toFixed(2)}${irrPart},
  }`;
}).join(',\n');

console.log(`// CalPERS PE Funds (as of March 31, 2025) - ${funds.length} funds\n`);
console.log(tsCode);
