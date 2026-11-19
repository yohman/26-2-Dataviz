export function clampSlide(value,count){const n=Number(value);return Number.isFinite(n)?Math.max(1,Math.min(count,Math.trunc(n))):1;}
export function scatterMarks(rows){return rows.filter(r=>Number.isFinite(r.income)&&r.income>0&&Number.isFinite(r.life)&&Number.isFinite(r.population)&&r.population>0);}
export function lineSegments(points){const result=[];let segment=[];for(const [year,value] of points){if(Number.isFinite(year)&&Number.isFinite(value))segment.push([year,value]);else if(segment.length){result.push(segment);segment=[];}}if(segment.length)result.push(segment);return result;}
export function safeDeckReturn(value,week=7){const w=Number(week)===8?8:7;return new RegExp('^agenda\\.html(?:\\?[-\\w.~%=&+]*)?#week-'+w+'$').test(value||'')?value:`agenda.html#week-${w}`;}
