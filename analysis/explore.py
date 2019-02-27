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
    if (i % 20 == 0):
      label.set_visible(True)
    else:
      label.set_visible(False)
    i += 1
#%%
df = pd.read_sql_query('''
  SELECT *, strftime('%Y-%m-%d %H', timestamp) AS bookingTime
  FROM flights
  WHERE flightId = 'ARNFRA0LH809'
''', conn)
fig, ax = plt.subplots()
ax.xaxis_date()
for key, group in df.groupby('bookingTime'):
  ax.plot(group['flightDate'], group['price'], label = key)
reduceLabels(ax.xaxis.get_ticklabels())
ax.legend(loc = 'center left', bbox_to_anchor = (1, 0.5))
fig.autofmt_xdate()
plt.show()

#%% [markdown]
# ## fetch all flights over departure time

#%%
df = pd.read_sql_query('''
  SELECT *, strftime('%Y-%m-%d %H', timestamp) AS bookingTime
  FROM flights
  WHERE bookingTime = '2019-02-26 23'
''', conn)
fig, ax = plt.subplots()
ax.xaxis_date()
for key, group in df.groupby('flightId'):
  ax.plot(group['flightDate'], group['price'], label = key)
reduceLabels(ax.xaxis.get_ticklabels())
ax.legend(loc = 'center left', bbox_to_anchor = (1, 0.5))
fig.autofmt_xdate()
plt.show()

#%% [markdown]
# ## fetch different booking times for one flight

#%%
df = pd.read_sql_query('''
  SELECT *, strftime('%Y-%m-%d %H', timestamp) AS bookingTime
  FROM flights
''', conn)
fig, ax = plt.subplots()
ax.xaxis_date()
for key, group in df.groupby(['flightDate', 'flightId']):
  ax.plot(group['bookingTime'], group['price'], label = key)
fig.autofmt_xdate()
plt.show()

#%%
conn.close()
