/* Transcribed from LOC originals, not reconstructed from pixel measurements. */
window.DUBOIS_DATA = {
  city: [
    ['Cities over 10,000 / 人口1万人超の都市', 78139],
    ['Cities 5,000–10,000 / 人口5千〜1万人の都市', 8025],
    ['Cities 2,500–5,000 / 人口2,500〜5千人の都市', 37699],
    ['Country and villages / 農村・村落', 734952]
  ],
  literacy: [[1860, 99, 'historical'], [1870, 92, 'historical'], [1880, 81.8, 'historical'], [1890, 67.27, 'historical'], [1900, 50, 'estimate']]
};
window.renderDuBoisGuide = function (ja) {
  const t = (jp,en) => ja ? jp : en;
  const citySource = 'https://www.loc.gov/item/2013650430/';
  const literacySource = 'https://www.loc.gov/pictures/item/2013650433/';
  return `<details class="pokemon-variable-guide dubois-data-guide"><summary>${t('原図とデータを開く','Original charts and data')}</summary>
    <p>${t('元の歴史的な分類・表現を含む資料です。説明には現在の言葉を使い、当時の差別や制度的な障壁の文脈を省かないようにしましょう。','The originals contain historical racial terminology. Use contemporary language in your own explanation and retain the context of discrimination and institutional barriers.')}</p>
    <h5>${t('A. 都市と農村の人口','A. City and rural population')}</h5>
    <p>${t('1890年、ジョージア州の黒人人口。単位は人。都市区分の人数は都市全体の人口ではなく、そこに住む黒人人口です。','Black population of Georgia in 1890. Unit: people. Counts refer to Black residents within each settlement category, not the total population of those cities.')}</p>
    <a href="${citySource}" target="_blank" rel="noopener"><img src="assets/images/week06/city-rural.jpg" alt="City and rural population, 1890" loading="lazy" style="display:block;max-width:100%;max-height:480px;margin:1rem auto;object-fit:contain"></a>
    <div class="pokemon-variable-scroll" tabindex="0"><table><thead><tr><th>${t('居住地の区分','Settlement category')}</th><th>${t('人数','People')}</th></tr></thead><tbody>${window.DUBOIS_DATA.city.map(([label,value])=>`<tr><td>${label.split(' / ')[ja?1:0]}</td><td>${value.toLocaleString('en-US')}</td></tr>`).join('')}</tbody></table></div>
    <p>${t('はじめの一歩：区分を行、人数を列にして横棒グラフ。全4区分を残し、長さの比較は0から始める。','First chart: settlement category on rows and population on columns, as horizontal bars. Retain all four categories and start the length scale at zero.')}</p>
    <p><a href="${citySource}" target="_blank" rel="noopener">Library of Congress · ppmsca.33873 ↗</a></p>
    <h5>${t('B. 読み書きができない人の割合','B. Illiteracy')}</h5>
    <p>${t('「The Georgia Negro」シリーズの割合（%）。分母となる年齢範囲は、この図だけでは明確ではありません。1900年は原図で年と値の両方に疑問符があり、推定として扱います。','Percentage in the “The Georgia Negro” series. The chart alone does not make the denominator’s age range explicit. Both the year and value for 1900 carry question marks in the original; treat that point as an estimate.')}</p>
    <a href="${literacySource}" target="_blank" rel="noopener"><img src="assets/images/week06/illiteracy.jpg" alt="Illiteracy chart, ca. 1900" loading="lazy" style="display:block;max-width:100%;max-height:480px;margin:1rem auto;object-fit:contain"></a>
    <div class="pokemon-variable-scroll" tabindex="0"><table><thead><tr><th>${t('年','Year')}</th><th>%</th><th>${t('扱い','Status')}</th></tr></thead><tbody>${window.DUBOIS_DATA.literacy.map(([year,value,status])=>`<tr><td>${year}</td><td>${value}</td><td>${status==='estimate'?t('推定（原図に疑問符）','Estimate (question marks in original)'):t('原図記載値','Value printed in original')}</td></tr>`).join('')}</tbody></table></div>
    <p>${t('はじめの一歩：年を横軸、割合を縦軸に。1900年だけ「推定」と付記する。AIに数値や残りの年を補完させないこと。','First chart: year on the horizontal axis and percentage on the vertical axis. Label 1900 “estimate.” Do not ask AI to fill in missing years or invent values.')}</p>
    <p><a href="${literacySource}" target="_blank" rel="noopener">Library of Congress · ppmsca.33876 ↗</a></p>
    <p>${t('数値は原図のラベルから転記。図から読み取れることと、追加調査が必要なことを分けましょう。','Values are transcribed from the original labels. Separate what the chart supports from questions that need further evidence.')}</p>
  </details>`;
};
