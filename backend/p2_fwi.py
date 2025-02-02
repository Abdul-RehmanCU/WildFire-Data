import numpy as np

def calculate_isi(ffmc, wind):
    """Calculate Initial Spread Index - Vectorized"""
    fm = 147.2 * (101.0 - ffmc) / (59.5 + ffmc)
    sf = 19.115 * np.exp(-0.1386 * fm) * (1.0 + (fm**5.31) / 4.93e7)
    return sf * (1.0 + 0.0201 * wind**2.496)

def calculate_bui(dmc, dc):
    """Calculate Buildup Index - Vectorized"""
    condition = dmc <= 0.4 * dc
    result = np.where(condition,
                     0.8 * dmc * dc / (dmc + 0.4 * dc),
                     dmc - (1.0 - 0.8 * dc / (dmc + 0.4 * dc)) * (0.92 + (0.0114 * dmc)**1.7))
    return result

def calculate_fwi(isi, bui):
    """Calculate Fire Weather Index - Vectorized"""
    condition = bui <= 80.0
    fD = np.where(condition,
                  0.626 * bui**0.809 + 2.0,
                  1000.0 / (25.0 + 108.64 * np.exp(-0.023 * bui)))
    
    B = 0.1 * isi * fD
    condition_B = B > 1.0
    return np.where(condition_B,
                   np.exp(2.72 * (0.434 * np.log(B))**0.647),
                   B)

def calculate_dsr(fwi):
    """Calculate Daily Severity Rating - Vectorized"""
    return 0.0272 * (fwi**1.77)

def calculate_ffmc_vectorized(temp, rh, wind, rain, prev_ffmc):
    """Calculate Fine Fuel Moisture Code - Vectorized"""
    # Constrain inputs
    temp = np.clip(temp, -50, 50)
    rh = np.clip(rh, 0, 100)
    wind = np.clip(wind, 0, 100)
    rain = np.clip(rain, 0, np.inf)

    # Initialize output array
    ffmc = prev_ffmc.copy()
    
    # Rain effect
    rain_mask = rain > 0.5
    rf = np.where(rain_mask, rain - 0.5, 0)
    
    # Calculate moisture content
    mo = np.where(prev_ffmc <= 150, prev_ffmc / 59.5, 
                 2.72 * (1.0 - np.exp(-0.679 * prev_ffmc/59.5)) + 
                 0.720 * np.exp(-0.179 * prev_ffmc/59.5) + 
                 0.174 * np.exp(-0.234 * prev_ffmc/59.5))
    
    # Rain effect on moisture
    mr = mo + 42.5 * rf * np.exp(-100.0 / (251.0 - mo)) * (1.0 - np.exp(-6.93 / rf))
    mr = np.where(mr > 250, 250, mr)
    
    # Update FFMC where there was rain
    ffmc = np.where(rain_mask, 59.5 * (250.0 - mr) / (147.27 + mr), ffmc)
    
    # Temperature and humidity effect
    ed = 0.942 * (rh ** 0.679) + (11.0 * np.exp((rh - 100.0) / 10.0)) + 0.18 * \
         (21.1 - temp) * (1.0 - np.exp(-0.115 * rh))
    
    mask_above_ed = ffmc > ed
    
    # Above equilibrium
    ko = 0.424 * (1.0 - (rh/100.0)**1.7) + 0.0694 * np.sqrt(wind) * \
         (1.0 - (rh/100.0)**8)
    kd = ko * 0.581 * np.exp(0.0365 * temp)
    m_above = ed + (ffmc - ed) * np.exp(-kd)
    
    # Below equilibrium
    ew = 0.618 * (rh**0.753) + (10.0 * np.exp((rh-100.0)/10.0)) + \
         0.18 * (21.1-temp) * (1.0-np.exp(-0.115*rh))
    
    mask_below_ew = ffmc < ew
    k1 = 0.424 * (1.0-(100.0-rh)/100.0**1.7) + \
         0.0694 * np.sqrt(wind) * (1.0-(100.0-rh)/100.0**8)
    kw = k1 * 0.581 * np.exp(0.0365*temp)
    m_below = ew - (ew-ffmc) * np.exp(-kw)
    
    # Combine results
    m = np.where(mask_above_ed, m_above,
                 np.where(mask_below_ew, m_below, ffmc))
    
    return np.clip(59.5 * (250.0-m)/(147.2+m), 0, 101)

def calculate_dmc_vectorized(temp, rh, rain, prev_dmc, month):
    """Calculate Duff Moisture Code - Vectorized"""
    # Constraints
    temp = np.clip(temp, -50, 50)
    rh = np.clip(rh, 0, 100)
    rain = np.clip(rain, 0, np.inf)
    
    # Initialize output
    dmc = prev_dmc.copy()
    
    # Rain effect
    rain_mask = rain > 1.5
    re = 0.92 * rain - 1.27
    mo = 20.0 + np.exp(5.6348 - prev_dmc/43.43)
    
    # Calculate b based on prev_dmc
    b = np.where(prev_dmc <= 33,
                 100.0 / (0.5 + 0.3 * prev_dmc),
                 np.where(prev_dmc <= 65,
                         14.0 - 1.3 * np.log(prev_dmc),
                         6.2 * np.log(prev_dmc) - 17.2))
    
    mr = mo + 1000.0 * re / (48.77 + b * re)
    pr = 244.72 - 43.43 * np.log(mr - 20.0)
    pr = np.clip(pr, 0, np.inf)
    
    # Update DMC where there was rain
    dmc = np.where(rain_mask, pr, dmc)
    
    # Temperature and humidity effect
    el = np.array([6.5, 7.5, 9.0, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8.0, 7.0, 6.0])
    el_month = el[month.astype(int) - 1]
    
    t = np.maximum(temp, -1.1)
    d1 = 1.894 * (t + 1.1) * (100.0 - rh) * el_month * 0.0001
    
    return np.maximum(0, dmc + d1)

def calculate_dc_vectorized(temp, rain, prev_dc, month):
    """Calculate Drought Code - Vectorized"""
    # Constraints
    temp = np.clip(temp, -50, 50)
    rain = np.clip(rain, 0, np.inf)
    
    # Initialize output
    dc = prev_dc.copy()
    
    # Rain effect
    rain_mask = rain > 2.8
    rd = 0.83 * rain - 1.27
    Qo = 800.0 * np.exp(-prev_dc/400.0)
    Qr = Qo + 3.937 * rd
    dr = 400.0 * np.log(800.0/Qr)
    dr = np.clip(dr, 0, np.inf)
    
    # Update DC where there was rain
    dc = np.where(rain_mask, dr, dc)
    
    # Temperature effect
    fl = np.array([-1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5.0, 2.4, 0.4, -1.6, -1.6])
    fl_month = fl[month.astype(int) - 1]
    
    temp_mask = temp > -2.8
    v = 0.36 * (temp + 2.8) + fl_month
    v = np.clip(v, 0, np.inf)
    
    return np.where(temp_mask, dc + 0.5 * v, dc)