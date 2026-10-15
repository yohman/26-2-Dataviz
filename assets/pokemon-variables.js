(() => {
  const rows = [
    ['Pokedex_ID','図鑑番号。各種を識別するID。','National Pokédex species identifier.','識別用・合計しない / Identifier, not a measure'],
    ['Name','英語名。','English species name.','カテゴリー / Category'],
    ['Name_Japanese','日本語名。','Japanese species name.','カテゴリー / Category'],
    ['Generation','最初に登場したゲームの世代（1〜9）。年齢ではありません。','Generation first introduced, not age.','不連続のディメンション / Discrete dimension'],
    ['Type_1','主タイプ。ほのお・みず・くさ等の属性で、ゲーム内の得意・不得意に関係します。','Primary elemental category, such as Fire, Water, or Grass.','カテゴリー / Category'],
    ['Type_1_Japanese','主タイプの日本語表記。','Japanese label for the primary type.','Type_1と同じ情報 / Same as Type_1'],
    ['Type_2','第2タイプ。2属性を持つ種もいます。空欄は第2タイプなし。','Secondary type; blank means the species has only one type.','カテゴリー・主タイプより弱いという意味ではない / Not a weaker type'],
    ['Type_2_Japanese','第2タイプの日本語表記。','Japanese label for the secondary type.','空欄あり / May be blank'],
    ['Height_m','標準の姿の身長（メートル）。','Height of the default form, in metres.','数値 / Numeric · m'],
    ['Weight_kg','標準の姿の体重（キログラム）。','Weight of the default form, in kilograms.','数値 / Numeric · kg'],
    ['HP','体力の基礎値。倒されにくさに関わる値。','Base health stat; contributes to how much damage it can withstand.','基礎能力値 / Base stat'],
    ['Attack','物理攻撃の強さの基礎値。','Base strength of physical attacks.','基礎能力値 / Base stat'],
    ['Defense','物理攻撃に対する防御の基礎値。','Base resistance to physical attacks.','基礎能力値 / Base stat'],
    ['Special_Attack','特殊攻撃（炎やビーム等）の強さの基礎値。','Base strength of special attacks, such as beams.','基礎能力値 / Base stat'],
    ['Special_Defense','特殊攻撃に対する防御の基礎値。','Base resistance to special attacks.','基礎能力値 / Base stat'],
    ['Speed','素早さの基礎値。行動順に関わる値で、走る速度（km/h）ではありません。','Base speed stat, affecting turn order; not physical speed in km/h.','基礎能力値 / Base stat'],
    ['Base_Stat_Total','HP〜Speedの6能力値の合計。これだけで勝敗や強さは決まりません。','Sum of six base stats; not a universal measure of battle performance.','派生値・6項目の合計 / Derived total'],
    ['Legendary','「伝説のポケモン」に分類されるか。Yes/No。','Whether the species is classified as Legendary.','カテゴリー / Yes or No'],
    ['Mythical','「幻のポケモン」に分類されるか。Legendaryとは別の分類。','Whether classified as Mythical, distinct from Legendary.','カテゴリー / Yes or No'],
    ['Image_URL','標準の姿の小さなPNG画像への公開リンク（PokéAPI sprites）。','Public PNG sprite URL for the default form, hosted by PokéAPI sprites.','不連続のディメンション → Image Role > URL / Discrete dimension with Image Role: URL']
  ];
  const tbody = document.querySelector('#pokemon-variables');
  rows.forEach(([name,ja,en,use])=>{
    const tr=document.createElement('tr'), key=document.createElement('td'), code=document.createElement('code'), meaning=document.createElement('td'), english=document.createElement('small'), usage=document.createElement('td');
    code.textContent=name; key.append(code); meaning.append(document.createTextNode(ja)); english.textContent=en; meaning.append(english); usage.textContent=use; tr.append(key,meaning,usage); tbody.append(tr);
  });
})();
