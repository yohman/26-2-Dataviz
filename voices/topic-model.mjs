// Local, explicit keyword matching. These are visual groupings, not participant labels.
const rules=[
 ['politics','政治・世界','Politics & world',/政治|選挙|戦争|国会|政権|トランプ|大統領|独裁|侵略|war\b|politic|election|trump|president/i],
 ['play','ゲーム・娯楽','Games & leisure',/ゲーム|ガチャ|パチンコ|スロット|競馬|ラッシュ|継続率|game|gacha|lottery/i],
 ['money','お金・生活費','Money & costs',/お金|給料|賃金|時給|学費|奨学金|物価|家賃|高すぎ|貧困|money|salary|wage|tuition|rent|cost|expensive/i],
 ['education','学校・学び','Education',/学校|授業|先生|教授|成績|評価|試験|テスト|宿題|大学|school|class|teacher|grade|exam|university/i],
 ['work','仕事・時間','Work & time',/仕事|バイト|シフト|残業|働|労働|休め|work|shift|job|overtime|employ/i],
 ['identity','偏見・差別','Bias & discrimination',/差別|偏見|外国人|国籍|性別|女性|男性|女の子|男の子|discriminat|racis|gender|foreigner|sexism/i],
 ['access','移動・場所','Access & places',/電車|バス|駅|通学|移動|エレベーター|車椅子|地方|交通|train|bus\b|station|transport|wheelchair|elevator/i],
 ['voice','決まり・声','Rules & voice',/ルール|規則|校則|制服|意見|発言|自由|選択|理不尽|rule|uniform|freedom|opinion|unfair/i],
 ['care','健康・ケア','Health & care',/健康|病院|病気|障害|ケア|介護|育児|休み|health|hospital|disab|care|illness/i],
 ['environment','環境・地域','Environment',/環境|ゴミ|ごみ|暑|公園|木陰|騒音|汚染|environment|climate|pollut|park|noise/i]
];
const stop=new Set('こと もの ため よう 自分 今回 感じ 思う 思っ ない ある いる する なる それ これ です ます から まで じゃ ほしい できる でき られる なっ もっと とても みんな 人たち わから いない おかしい 不公平 社会 不満 いう 言わ 言う され だけ でも この その すぎ なく なくなる した して told really just 同じ 問題 人間 the and that this with have they them their there because about people should would could when what more than unfair think feel'.split(' '));
export function detectTopics(entries){
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ja',{granularity:'word'}):null;
 const texts=new Map(entries.map(e=>[e.id,`${e.headline||''} ${e.detail||''}`.normalize('NFKC').toLowerCase()]));
 const buckets=rules.map(([id,ja,en,pattern])=>({id:`theme:${id}`,ja,en,kind:'theme',members:entries.filter(e=>pattern.test(texts.get(e.id))).map(e=>e.id)})).filter(g=>g.members.length>=2);
 const terms=new Map();
 for(const e of entries){const text=texts.get(e.id);const tokens=segmenter?[...segmenter.segment(text)].filter(t=>t.isWordLike).map(t=>t.segment):text.match(/[a-z]{3,}|[一-龯ァ-ヶ]{2,}/g)||[];
 for(const token of new Set(tokens)){if(token.length<2||stop.has(token)||/^[ぁ-ん\d]+$/.test(token)||/^[a-z]{1,2}$/.test(token))continue;if(!terms.has(token))terms.set(token,[]);terms.get(token).push(e.id);}}
 const words=[...terms].filter(([,ids])=>ids.length>=2&&ids.length<Math.max(4,entries.length*.7)).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0])).slice(0,16).map(([term,members])=>({id:`term:${term}`,ja:term,en:term,kind:'term',members}));
 const groups=[...buckets,...words];const membership=new Map(entries.map(e=>[e.id,groups.filter(g=>g.members.includes(e.id)).map(g=>g.id)]));return {groups,membership};
}
export function packVoices(nodes,aspect=1.7,gap=48){
 if(!nodes.length)return {width:1200,height:700};
 const width=Math.max(430,...nodes.map(n=>n.w))+gap;
 const area=nodes.reduce((s,n)=>s+(n.w+gap)*(n.h+gap),0);
 const columns=Math.max(1,Math.ceil(Math.sqrt(area*Math.max(.7,aspect))/width));
 const heights=Array(columns).fill(70);
 nodes.forEach(n=>{const col=heights.indexOf(Math.min(...heights));n.x=70+col*width+width/2;n.y=heights[col]+n.h/2;n.tx=n.x;n.ty=n.y;n.vx=n.vy=0;heights[col]+=n.h+gap;});
 return {width:columns*width+140,height:Math.max(...heights)+40};
}
