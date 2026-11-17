import type { Bi } from "../i18n";

export type DoorKind = "greeting" | "message" | "fact" | "activity" | "challenge";

export interface Door {
  day: number;
  kind: DoorKind;
  title: Bi;
  /** `{family}` is replaced with the family name from Settings. */
  body: Bi;
  link?: { href: string; label: Bi };
}

export const KIND_LABEL: Record<DoorKind, Bi> = {
  greeting: ["A greeting for you", "給你的問候"],
  message: ["Today's message", "今日小語"],
  fact: ["Christmas fact", "聖誕小知識"],
  activity: ["Mini activity", "小活動"],
  challenge: ["Family challenge", "家庭挑戰"],
};

export const DOORS: Door[] = [
  {
    day: 1,
    kind: "greeting",
    title: ["Welcome to December", "歡迎來到十二月"],
    body: [
      "Dear {family}, the first door is open. For the next twenty-five days there is one small surprise waiting here each morning. Come back together, and let the countdown begin.",
      "親愛的{family}，第一扇門打開了。接下來的二十五天，每天早上這裡都有一個小驚喜等著你們。一起回來看看，倒數正式開始。",
    ],
  },
  {
    day: 2,
    kind: "fact",
    title: ["A carol with a guitar", "吉他伴奏的頌歌"],
    body: [
      "“Silent Night” was first sung on Christmas Eve 1818 in the village church of Oberndorf, Austria — accompanied by a guitar. Today it is sung in hundreds of languages.",
      "〈平安夜〉在 1818 年的聖誕夜，於奧地利奧伯恩多夫的小教堂首次演唱，當時是用吉他伴奏。如今它已被翻譯成數百種語言。",
    ],
    link: { href: "/music", label: ["Listen to Silent Night", "聽〈平安夜〉"] },
  },
  {
    day: 3,
    kind: "activity",
    title: ["Paper snowflakes", "剪紙雪花"],
    body: [
      "Fold a square of paper into a triangle three times, snip little shapes along the edges, and unfold. Real snow crystals have six sides — can you make one with six points? Tape your favourites to a window.",
      "把正方形紙對折成三角形三次，在邊緣剪出小形狀，再打開。真正的雪花結晶有六個邊，你能剪出六角雪花嗎？把最喜歡的貼在窗戶上。",
    ],
  },
  {
    day: 4,
    kind: "challenge",
    title: ["Secret kindness", "祕密的善意"],
    body: [
      "Today everyone does one kind thing for someone at home — without being caught. Make a bed, leave a note, pour a drink. At dinner, try to guess who did what.",
      "今天每個人都為家裡的某個人做一件貼心的事，而且不能被發現。鋪床、留一張紙條、倒一杯水。晚餐時猜猜看是誰做的。",
    ],
  },
  {
    day: 5,
    kind: "message",
    title: ["Slow down", "慢下來"],
    body: [
      "December moves quickly. Tonight, turn the big lights off and the little lights on. Ten quiet minutes together counts as a tradition.",
      "十二月總是過得很快。今晚，關掉大燈，打開小燈。安靜地一起待十分鐘，也算是一種傳統。",
    ],
    link: { href: "/ambient", label: ["Open the fireplace", "打開壁爐場景"] },
  },
  {
    day: 6,
    kind: "fact",
    title: ["Saint Nicholas Day", "聖尼古拉節"],
    body: [
      "In many European countries, 6 December is Saint Nicholas Day. Children leave their shoes out the night before and wake up to find sweets, nuts and small gifts inside.",
      "在許多歐洲國家，12 月 6 日是聖尼古拉節。孩子們前一晚把鞋子放在門口，隔天醒來就會發現裡面裝著糖果、堅果和小禮物。",
    ],
  },
  {
    day: 7,
    kind: "activity",
    title: ["Cocoa bar", "熱可可吧"],
    body: [
      "Set out mugs, hot chocolate and toppings — marshmallows, cinnamon, orange peel, a crushed biscuit. Everyone invents a recipe and gives it a name.",
      "準備好馬克杯、熱可可和配料：棉花糖、肉桂、橙皮、壓碎的餅乾。每個人發明一種配方，並為它取個名字。",
    ],
  },
  {
    day: 8,
    kind: "challenge",
    title: ["Call someone far away", "打給遠方的人"],
    body: [
      "Pick a grandparent, cousin or old friend you have not spoken to for a while. Call them together and ask what Christmas was like when they were small.",
      "選一位好久沒聯絡的阿公阿嬤、表兄弟姊妹或老朋友。全家一起打電話，問問他們小時候的聖誕節是什麼樣子。",
    ],
  },
  {
    day: 9,
    kind: "fact",
    title: ["The first Christmas card", "第一張聖誕卡"],
    body: [
      "The first commercial Christmas card was commissioned in London in 1843 by Sir Henry Cole and illustrated by John Callcott Horsley — the same year Dickens published “A Christmas Carol”.",
      "第一張商業聖誕卡誕生於 1843 年的倫敦，由亨利・柯爾爵士委託、約翰・卡爾科特・霍斯利繪製。同一年，狄更斯出版了《小氣財神》。",
    ],
    link: { href: "/wallpapers", label: ["Make your own card", "製作自己的卡片"] },
  },
  {
    day: 10,
    kind: "activity",
    title: ["Living-room carols", "客廳音樂會"],
    body: [
      "Put a carol on and sing along — loudly, badly and together. Spoons and saucepans are officially instruments tonight.",
      "播放一首頌歌，大家一起唱，大聲唱、走音也沒關係。今晚湯匙和鍋子都是正式樂器。",
    ],
    link: { href: "/music", label: ["Open the music player", "打開音樂播放器"] },
  },
  {
    day: 11,
    kind: "message",
    title: ["Two weeks to go", "還有兩個星期"],
    body: [
      "Dear {family}, in two weeks it will be Christmas morning. You do not need a perfect holiday — only a warm one. You are already doing that part well.",
      "親愛的{family}，再過兩個星期就是聖誕早晨了。你們不需要一個完美的假期，只需要一個溫暖的假期。這一點，你們已經做得很好。",
    ],
  },
  {
    day: 12,
    kind: "challenge",
    title: ["One in, one out", "一進一出"],
    body: [
      "Each person chooses one toy, book or piece of clothing in good condition to give away. Pack them in a box together and decide where it should go.",
      "每個人選一件狀況良好的玩具、書或衣服送給需要的人。一起把它們裝進箱子，討論要送到哪裡。",
    ],
  },
  {
    day: 13,
    kind: "fact",
    title: ["Reindeer eyes", "馴鹿的眼睛"],
    body: [
      "Reindeer are the only deer in which both males and females grow antlers. Even more surprising: the reflective layer in their eyes turns from gold in summer to deep blue in winter, helping them see in the Arctic dark.",
      "馴鹿是唯一公鹿和母鹿都會長角的鹿。更神奇的是，牠們眼睛裡的反光層夏天是金色，冬天會變成深藍色，幫助牠們在北極的黑暗中看得更清楚。",
    ],
  },
  {
    day: 14,
    kind: "activity",
    title: ["Bake something", "一起烤點心"],
    body: [
      "Biscuits, gingerbread, or whatever the oven allows. One rule: everybody decorates at least one, and the strangest-looking one gets eaten first.",
      "餅乾、薑餅，或任何烤箱做得出來的東西。只有一個規則：每個人至少裝飾一塊，長得最奇怪的那塊最先吃掉。",
    ],
  },
  {
    day: 15,
    kind: "challenge",
    title: ["Candlelight evening", "燭光之夜"],
    body: [
      "For one hour tonight: no phones, no television. Light candles or fairy lights, and play a board game or tell stories instead.",
      "今晚有一個小時：不看手機、不開電視。點上蠟燭或小燈串，玩桌遊或說故事。",
    ],
  },
  {
    day: 16,
    kind: "fact",
    title: ["Jingle Bells in space", "太空中的聖誕鈴聲"],
    body: [
      "On 16 December 1965, the astronauts of Gemini 6 played “Jingle Bells” on a smuggled harmonica and a set of small bells — the first song ever performed in space.",
      "1965 年 12 月 16 日，雙子星六號的太空人用偷偷帶上太空的口琴和小鈴鐺演奏了〈聖誕鈴聲〉，這是人類在太空中演奏的第一首歌。",
    ],
    link: { href: "/music", label: ["Play Jingle Bells", "播放〈聖誕鈴聲〉"] },
  },
  {
    day: 17,
    kind: "activity",
    title: ["A letter to Santa", "寫信給聖誕老人"],
    body: [
      "Write or draw a letter to Santa. Tell him one thing you wish for, one thing you are thankful for, and one kind thing you did this year. Or ask him a question yourself.",
      "寫一封信或畫一張圖給聖誕老人。告訴他一個願望、一件感謝的事，還有今年做過的一件好事。也可以直接問他問題。",
    ],
    link: { href: "/santa", label: ["Talk to Santa", "和聖誕老人聊聊"] },
  },
  {
    day: 18,
    kind: "message",
    title: ["One week", "只剩一週"],
    body: [
      "One week left. If the list is long, cross off the things nobody will remember — and keep the ones everybody will.",
      "只剩一個星期。如果待辦清單太長，就把沒有人會記得的事劃掉，留下大家都會記得的事。",
    ],
  },
  {
    day: 19,
    kind: "fact",
    title: ["The Christmas flower", "聖誕紅"],
    body: [
      "The poinsettia grows wild in Mexico. Its English name comes from Joel Roberts Poinsett, the first United States minister to Mexico, who sent plants home in the 1820s. The red “petals” are actually leaves.",
      "聖誕紅原產於墨西哥。它的英文名字來自美國首任駐墨西哥公使喬爾・羅伯茨・波因塞特，他在 1820 年代把這種植物帶回美國。那些紅色的「花瓣」其實是葉子。",
    ],
  },
  {
    day: 20,
    kind: "challenge",
    title: ["The family photo", "全家福"],
    body: [
      "Take this year's family photo today. It does not need to be tidy — pyjamas and messy hair are welcome. Then pin it to the Family Wall.",
      "今天拍一張今年的全家福。不用太整齊，睡衣和亂亂的頭髮都歡迎。然後把它貼到家庭留言牆上。",
    ],
    link: { href: "/wall", label: ["Open the Family Wall", "打開家庭留言牆"] },
  },
  {
    day: 21,
    kind: "fact",
    title: ["The longest night", "最長的夜晚"],
    body: [
      "The winter solstice — the longest night of the year in the northern hemisphere — falls on 21 or 22 December depending on your time zone. In Taiwan it is Dongzhi, when families gather to eat warm tangyuan. From here, every day gets a little brighter.",
      "冬至是北半球一年中夜晚最長的一天，依時區落在 12 月 21 日或 22 日。在台灣，冬至這天全家會團聚吃熱呼呼的湯圓。從這天起，白天會一天比一天長。",
    ],
  },
  {
    day: 22,
    kind: "activity",
    title: ["Wrap together", "一起包禮物"],
    body: [
      "Turn wrapping into an evening: music on, tape and ribbon in the middle of the table. Draw your own gift tags and write one nice sentence on each.",
      "把包禮物變成一個夜晚的活動：放音樂，把膠帶和緞帶放在桌子中間。自己畫禮物吊牌，在每張上面寫一句溫暖的話。",
    ],
    link: { href: "/wallpapers", label: ["Design a greeting card", "設計一張賀卡"] },
  },
  {
    day: 23,
    kind: "message",
    title: ["Almost there", "就快到了"],
    body: [
      "Tomorrow is Christmas Eve. Tonight, look around the room at the people in it. They are the best part.",
      "明天就是平安夜了。今晚，看看房間裡的每一個人。他們就是最棒的那部分。",
    ],
  },
  {
    day: 24,
    kind: "greeting",
    title: ["Christmas Eve", "平安夜"],
    body: [
      "Dear {family}, tonight is the night. Since 1955, NORAD has followed Santa's sleigh around the world on Christmas Eve — so hang the stockings, switch to the Christmas Eve atmosphere, and get to bed on time.",
      "親愛的{family}，就是今晚了。從 1955 年開始，北美防空司令部每年平安夜都會追蹤聖誕老人的雪橇。掛好聖誕襪，切換到「平安夜」氛圍，然後準時上床睡覺。",
    ],
    link: { href: "/", label: ["Go to the dashboard", "回到首頁"] },
  },
  {
    day: 25,
    kind: "greeting",
    title: ["Merry Christmas", "聖誕快樂"],
    body: [
      "Merry Christmas, {family}! Thank you for opening every door together. May today be full of warm food, loud laughter and people you love — and may you keep a little of it all year.",
      "{family}，聖誕快樂！謝謝你們一起打開每一扇門。願今天充滿熱騰騰的食物、響亮的笑聲和你們所愛的人，也願這份溫暖陪伴你們一整年。",
    ],
  },
];
