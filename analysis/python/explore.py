#%% [markdown]
# # Explore flight data

#%%
import os
from pathlib import Path
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt

cwd = Path().resolve()
dbFileName = os.path.join(cwd, 'db', 'flights.sqlite')
conn = sqlite3.connect(dbFileName)

#%% [markdown]
# ## fetch a fixed flight over departure time

#%%
def reduceLabels(labels):
  i = 0
  for label in labels:
    label.set_visible(not bool(i % 20))
    i += 1
#%%
df = pd.read_sql_query('''
  SELECT *,
  strftime('%Y-%m-%d %H', timestamp) AS bookingTime,
  strftime('%Y-%m-%d', flightDate) AS flightDateFormatted
  FROM flights
  WHERE flightId = 'ARNFRA0LH809'
''', conn)
fig, ax = plt.subplots()
ax.xaxis_date()
for key, group in df.groupby('bookingTime'):
  ax.plot(group['flightDateFormatted'], group['price'], label = key)
reduceLabels(ax.xaxis.get_ticklabels())
#ax.legend(loc = 'center left', bbox_to_anchor = (1, 0.5))
fig.autofmt_xdate()
plt.show()
fig.savefig(os.path.join(cwd, 'analysis', 'output', 'flightsbookingoverlay.pdf'))

#%% [markdown]
# ## fetch all flights over departure time

#%%
df = pd.read_sql_query('''
  SELECT *,
  strftime('%Y-%m-%d %H', timestamp) AS bookingTime,
  (julianday(timestamp) - julianday(departure)) AS daysRemaining
  FROM flights
  WHERE bookingTime = '2019-03-01 11'
  ORDER BY flightDate
''', conn)
fig, ax = plt.subplots()
for key, group in df.groupby('flightId'):
  ax.plot(group['daysRemaining'], group['price'], label = key)
ax.legend(loc = 'center left', bbox_to_anchor = (1, 0.5))
plt.show()
fig.savefig(os.path.join(cwd, 'analysis', 'output', 'routetimeline.pdf'))

#%% [markdown]
# ## fetch different booking times per flight

#%%
df = pd.read_sql_query('''
  SELECT *,
  strftime('%Y-%m-%d %H', timestamp) AS bookingTime,
  (julianday(timestamp) - julianday(departure)) AS daysRemaining
  FROM flights
''', conn)
fig, ax = plt.subplots()
for key, group in df.groupby(['flightDate', 'flightId']):
  ax.plot(group['daysRemaining'], group['price'], label = key, linewidth = 0.4)
plt.show()
fig.savefig(os.path.join(cwd, 'analysis', 'output', 'pricetimeline.pdf'))

#%% [markdown]
# ## fetch different booking times (not ordered)

#%%
df = pd.read_sql_query('''
  SELECT *,
  strftime('%Y-%m-%d', timestamp) AS bookingTime
  FROM flights
''', conn)
fig, ax = plt.subplots()
ax.xaxis_date()
for key, group in df.groupby(['flightDate', 'flightId']):
  ax.plot(group['bookingTime'], group['price'], label = key, linewidth = 0.4)
fig.autofmt_xdate()
plt.show()
fig.savefig(os.path.join(cwd, 'analysis', 'output', 'bookingtimeline.pdf'))


#%%
conn.close()
