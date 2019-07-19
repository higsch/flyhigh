import {
  utcParse,
  timeFormat } from 'd3';

export const timeParser = (datetime) => utcParse('%Y-%m-%dT%I:%M:%SZ')(datetime);

export const formatTime = timeFormat('%Y-%m-%d');
