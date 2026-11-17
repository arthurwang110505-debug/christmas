import type { Lang } from "../i18n";

/**
 * Santa's "workshop letters": the built-in, no-API fallback.
 * Everything here runs on the device, costs nothing and works offline.
 */

type Pair = readonly [en: string, zh: string];

interface Intent {
  match: RegExp;
  replies: Pair[];
}

const INTENTS: Intent[] = [
  {
    match: /\b(reindeer|rudolph|dasher|dancer|prancer|vixen|comet|cupid|donner|blitzen)\b|(馴鹿|魯道夫|紅鼻子)/i,
    replies: [
      [
        "Ho ho ho! The reindeer are in fine form. Dasher has been practising rooftop landings, and Rudolph's nose is polished and glowing. Their favourite snack is carrots — a crunchy one by the window never goes unnoticed.",
        "呵呵呵！馴鹿們狀況好極了。猛衝者正在練習屋頂降落，魯道夫的鼻子也擦得亮晶晶。牠們最愛吃紅蘿蔔，放一根在窗邊，牠們一定會發現。",
      ],
      [
        "Nine reindeer pull my sleigh: Dasher, Dancer, Prancer, Vixen, Comet, Cupid, Donner, Blitzen — and Rudolph at the front when it is foggy. They sleep in the warm stable tonight and dream of flying.",
        "拉雪橇的馴鹿一共有九隻：猛衝者、舞者、歡騰、悍婦、彗星、丘比特、雷神、閃電，起霧的時候還有魯道夫在最前面帶路。牠們今晚睡在暖暖的鹿棚裡，夢裡都在飛。",
      ],
    ],
  },
  {
    match: /\b(naughty|nice|good (boy|girl|kid)|been good)\b|(乖|好孩子|壞孩子|名單)/i,
    replies: [
      [
        "I have checked my list — twice, as always. Being on the nice list is not about being perfect. It is about being kind, saying sorry when you need to, and trying again tomorrow. From what I hear, you are doing well.",
        "我已經檢查過名單了，照例檢查了兩次。要在好孩子名單上，不需要完美，只要善良、該道歉時說對不起，然後明天再努力一次。就我聽到的消息，你做得很好。",
      ],
    ],
  },
  {
    match: /\b(presents?|gifts?|toys?|wish ?list|want|wish for)\b|(禮物|玩具|願望|想要)/i,
    replies: [
      [
        "The elves are busy in the workshop this very minute! Tell me — what is one thing you are wishing for this year? And is there something you would like to give to someone else? Those are my favourite wishes of all.",
        "小精靈們此刻正在工坊裡忙著呢！告訴我，你今年最想要的一樣東西是什麼？還有，你有沒有想送給別人的禮物？那可是我最喜歡的願望。",
      ],
      [
        "A wish! I am writing it down in my big book with my best pen. I cannot make promises about what fits in the sleigh, but I can promise that every wish is read carefully, by candlelight, with a cup of cocoa.",
        "一個願望！我正用最好的筆把它寫進我的大本子裡。雪橇裝得下什麼我不能保證，但我保證每個願望我都會在燭光下、配著一杯熱可可，仔細讀過。",
      ],
    ],
  },
  {
    match: /\b(north pole|where (do|are) you|live|cold|snow)\b|(北極|住在哪|住哪|下雪|冷不冷)/i,
    replies: [
      [
        "I live at the North Pole, where the snow squeaks under your boots and the northern lights dance green across the sky. It is very cold outside, but the workshop is warm and smells of pine and gingerbread.",
        "我住在北極，那裡的雪踩下去會吱吱作響，極光在天空中跳著綠色的舞。外面非常冷，但工坊裡暖烘烘的，聞起來有松樹和薑餅的味道。",
      ],
    ],
  },
  {
    match: /\b(cookies?|biscuits?|milk|eat|food|hungry|cocoa)\b|(餅乾|牛奶|吃|熱可可|餓)/i,
    replies: [
      [
        "Ah, you have found my weakness! I am very fond of biscuits and a glass of milk — though Mrs Claus says I should eat the carrot too. Whatever you leave out, I will be grateful. It is a long night.",
        "啊，你發現我的弱點了！我非常喜歡餅乾配牛奶，不過聖誕太太說我也該把紅蘿蔔吃掉。不管你留下什麼，我都會很感謝，畢竟那是很長的一夜。",
      ],
    ],
  },
  {
    match: /\b(elf|elves|claus|workshop|mrs\.? claus)\b|(小精靈|精靈|工坊|聖誕太太|聖誕奶奶)/i,
    replies: [
      [
        "The elves are the heart of the workshop. Some paint, some stitch, some test every toy twice — the testing team is always the most popular. Mrs Claus keeps us all fed and makes sure I wear my scarf.",
        "小精靈是工坊的靈魂。有的負責上色，有的負責縫紉，有的負責把每個玩具測試兩遍，測試組永遠最受歡迎。聖誕太太負責餵飽大家，還會盯著我戴好圍巾。",
      ],
    ],
  },
  {
    match: /\b(how old|your age|birthday)\b|(幾歲|年紀|生日)/i,
    replies: [
      [
        "Older than the oldest Christmas tree you have ever seen, and still young enough to laugh at a good joke. I stopped counting candles a long time ago — the cake kept catching fire!",
        "比你見過最老的聖誕樹還要老，但還年輕得聽到好笑話會哈哈大笑。我很久以前就不數蠟燭了，因為蛋糕老是燒起來！",
      ],
    ],
  },
  {
    match: /\b(chimney|how do you (get|come)|fly|sleigh|one night)\b|(煙囪|怎麼進來|飛|雪橇|一個晚上)/i,
    replies: [
      [
        "That is a little bit of Christmas magic, and a great deal of practice. No chimney? No trouble — I have a special key that only works on Christmas Eve, and only for homes where someone is hoping.",
        "那是一點點聖誕魔法，加上很多很多練習。沒有煙囪？沒問題，我有一把特別的鑰匙，只在平安夜有用，而且只開得了有人懷著期待的家門。",
      ],
    ],
  },
  {
    match: /\b(real|exist|believe)\b|(真的|存在|相信)/i,
    replies: [
      [
        "As real as the warm feeling you get when you give someone a present and watch them open it. Wherever people are kind to each other at Christmas, that is where you will find me.",
        "就像你把禮物送給別人、看著他們打開時心裡那股暖暖的感覺一樣真實。只要人們在聖誕節對彼此善良，我就在那裡。",
      ],
    ],
  },
  {
    match: /\b(thank|thanks)\b|(謝謝|感謝)/i,
    replies: [
      [
        "You are most welcome! A thank-you is one of my favourite presents — it weighs nothing and fits in every sleigh.",
        "不客氣！一聲謝謝是我最喜歡的禮物之一，它一點也不重，任何雪橇都裝得下。",
      ],
    ],
  },
  {
    match: /\b(sad|scared|afraid|lonely|worried|miss)\b|(難過|害怕|孤單|擔心|想念)/i,
    replies: [
      [
        "Thank you for telling me. Even at Christmas, it is all right to feel sad or worried sometimes. Tell a grown-up you trust how you feel, and ask for a big hug — hugs are one thing the workshop cannot make, so we need people for that.",
        "謝謝你告訴我。就算在聖誕節，有時候覺得難過或擔心也沒關係。把你的感覺告訴一位你信任的大人，然後要一個大大的擁抱。擁抱是工坊做不出來的東西，所以需要人來給。",
      ],
    ],
  },
  {
    match: /\b(jokes?|funny|laugh)\b|(笑話|好笑)/i,
    replies: [
      [
        "Here is one from the elves: What do snowmen eat for breakfast? Frosted flakes! Ho ho ho — they told me that one four times today.",
        "小精靈教我一個：雪人最怕什麼？怕「融」入大家！呵呵呵，這個笑話他們今天已經講四遍了。",
      ],
    ],
  },
  {
    match: /^(hi|hello|hey|good (morning|evening|afternoon))\b|^(你好|哈囉|嗨|您好|早安|晚安)/i,
    replies: [
      [
        "Ho ho ho, hello! How lovely to hear from you. The fire is lit and I have a moment before the elves need me. What would you like to talk about?",
        "呵呵呵，你好呀！很高興收到你的消息。爐火正旺，小精靈來找我之前我還有一點時間。你想聊些什麼呢？",
      ],
    ],
  },
];

const FALLBACK: Pair[] = [
  [
    "Ho ho ho! That is a wonderful thing to tell Santa. I am writing it in my big book right now. Tell me more — or ask me about the reindeer, the elves or the North Pole.",
    "呵呵呵！能聽你說這些真是太好了，我現在就把它寫進我的大本子裡。再多說一點吧，或者問問我馴鹿、小精靈或北極的事。",
  ],
  [
    "What a thoughtful thing to say. You know, the best part of my job is not the sleigh ride — it is hearing from families like yours. What are you looking forward to most this Christmas?",
    "你說得真貼心。你知道嗎，我的工作裡最棒的不是坐雪橇，而是聽到像你們這樣的家庭的消息。今年聖誕節你最期待什麼呢？",
  ],
  [
    "I am nodding and stroking my beard — that means I am thinking about it carefully. While I think: have you done something kind for someone this week? I would love to hear about it.",
    "我正一邊點頭一邊摸鬍子，這表示我在認真思考。趁我思考的時候問問你：這個星期你有沒有為別人做一件貼心的事？我很想聽聽。",
  ],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Reply to a chat message from the built-in collection. `turn` varies the fallback lines. */
export function localChatReply(message: string, lang: Lang, turn: number): string {
  const idx = lang === "zh" ? 1 : 0;
  for (const intent of INTENTS) {
    if (intent.match.test(message)) {
      return intent.replies[(hash(message) + turn) % intent.replies.length][idx];
    }
  }
  return FALLBACK[turn % FALLBACK.length][idx];
}

export type GreetingTone = "warm" | "playful" | "short";

const GREETINGS: Record<GreetingTone, Pair[]> = {
  warm: [
    [
      "Dear {to},\n\nWishing you a Christmas wrapped in warmth — quiet mornings, glowing evenings and the people you love close by. Thank you for making this year brighter just by being in it.\n\nWith love,\n{from}",
      "親愛的{to}：\n\n願你的聖誕節被溫暖包圍，有安靜的早晨、發光的夜晚，還有你愛的人在身邊。謝謝你，因為有你，這一年更明亮了。\n\n愛你的\n{from}",
    ],
    [
      "Dear {to},\n\nMay your home be full of light, your table full of good things, and your heart full of peace this Christmas. We are so glad you are part of our story.\n\nMerry Christmas,\n{from}",
      "親愛的{to}：\n\n願這個聖誕節，你的家充滿光亮，餐桌擺滿美好的食物，心裡滿是平安。很高興你是我們故事的一部分。\n\n聖誕快樂\n{from}",
    ],
  ],
  playful: [
    [
      "Dear {to},\n\nOfficial notice from the North Pole: you have been found guilty of being wonderful all year. Your sentence is one very merry Christmas, extra dessert and at least three naps.\n\nHo ho ho,\n{from}",
      "親愛的{to}：\n\n北極正式通知：經查，你一整年都非常可愛，罪證確鑿。判決如下：一個超級快樂的聖誕節、加倍的甜點，以及至少三次午睡。\n\n呵呵呵\n{from}",
    ],
    [
      "Dear {to},\n\nMay your fairy lights never tangle, your cocoa never go cold, and your wrapping paper always be exactly the right length. Have the merriest Christmas!\n\nCheers,\n{from}",
      "親愛的{to}：\n\n願你的燈串永遠不打結、熱可可永遠不會涼、包裝紙永遠剛剛好夠長。祝你有個最快樂的聖誕節！\n\n{from} 敬上",
    ],
  ],
  short: [
    ["Merry Christmas, {to}! Warm wishes and a happy New Year — from {from}.", "{to}，聖誕快樂！獻上溫暖的祝福，也祝新年快樂。{from} 敬上"],
    ["To {to}: peace, joy and plenty of cocoa this Christmas. Love, {from}.", "給{to}：願你這個聖誕平安、喜樂，還有喝不完的熱可可。愛你的{from}"],
  ],
};

export function localGreeting(to: string, from: string, tone: GreetingTone, lang: Lang, seed: number): string {
  const idx = lang === "zh" ? 1 : 0;
  const list = GREETINGS[tone];
  const fallbackTo = lang === "zh" ? "你" : "friend";
  const fallbackFrom = lang === "zh" ? "我們全家" : "all of us";
  return list[seed % list.length][idx]
    .replaceAll("{to}", to.trim() || fallbackTo)
    .replaceAll("{from}", from.trim() || fallbackFrom);
}

const STORIES: Pair[] = [
  [
    "On the night before Christmas, {name} could not sleep. Outside the window, something small was tapping on the glass — a tiny reindeer, no bigger than a cat, with snow on its nose.\n\n“I am lost,” said the reindeer. “I was following the sleigh, but the snow came down and I could not see the way.”\n\n{name} thought for a moment, then fetched {thing} and held it up to the window. “Follow this,” {name} whispered. “It always helps me feel brave.”\n\nThe little reindeer looked, and its eyes began to shine. High above the rooftops a bell rang once, soft and far away. The reindeer leapt into the air, turned a circle to say thank you, and flew towards the sound.\n\nIn the morning there was a single silver bell on the windowsill — and {name} knew exactly who had left it.",
    "聖誕節的前一晚，{name}怎麼也睡不著。窗外有個小小的東西在輕輕敲玻璃，原來是一隻只有貓咪那麼大的小馴鹿，鼻子上還沾著雪。\n\n「我迷路了，」小馴鹿說，「我本來跟著雪橇，可是雪下得太大，我看不見路了。」\n\n{name}想了一下，把{thing}拿來，舉到窗邊。「跟著它走，」{name}小聲說，「它總是讓我變得勇敢。」\n\n小馴鹿看了看，眼睛開始發亮。屋頂上方很遠的地方，傳來一聲輕輕的鈴響。小馴鹿跳到空中，轉了一圈表示謝謝，然後朝著聲音飛去。\n\n第二天早上，窗台上放著一個銀色的小鈴鐺。{name}一看就知道是誰留下的。",
  ],
  [
    "Deep in the workshop at the North Pole, the elves had a problem. The very last present of the year would not stay wrapped. Every time they tied the ribbon, it wriggled loose.\n\n“It needs something special,” said the oldest elf. “It needs a wish from someone kind.”\n\nSo Santa opened his big book and found the name {name}. That very evening, {name} had shared {thing} with a friend without even being asked.\n\nSanta wrote the kind deed on a tiny golden tag and tied it to the ribbon. At once the bow held tight and the whole workshop cheered.\n\n“You see,” Santa said, pulling on his gloves, “kindness is the strongest ribbon there is.” And far away, fast asleep, {name} smiled without knowing why.",
    "在北極工坊的深處，小精靈們遇到了一個難題。今年的最後一份禮物怎麼包都包不好，每次綁上緞帶，它就自己鬆開。\n\n「它需要一點特別的東西，」最年長的小精靈說，「它需要一個來自善良的人的願望。」\n\n於是聖誕老人翻開他的大本子，找到了{name}的名字。就在那天傍晚，{name}沒等別人開口，就把{thing}分享給了朋友。\n\n聖誕老人把這件好事寫在一張小小的金色吊牌上，綁在緞帶上。蝴蝶結立刻綁得牢牢的，整個工坊都歡呼起來。\n\n「你們看，」聖誕老人一邊戴上手套一邊說，「善良是世界上最牢固的緞帶。」而在很遠的地方，睡得正香的{name}，不知道為什麼笑了。",
  ],
  [
    "The snow fell so softly on the village that night that nobody heard it — nobody except {name}, who was watching from the window with {thing} tucked under one arm.\n\nAt the edge of the square stood the big Christmas tree, and one of its lights had gone out. Just one, near the top. The tree looked a little sad.\n\n{name} put on boots and a scarf, went out into the quiet, and looked up. “I can't reach,” {name} said. “But I can wish.”\n\nSo {name} closed both eyes and wished — not for a present, but for the little light to shine again. A warm wind passed through the branches. Sleigh bells, very faint. And when {name} looked up, the light was glowing gold, brighter than all the rest.\n\nIt stayed lit all winter. Some say it is still shining now.",
    "那天晚上，雪輕輕地落在小鎮上，輕得沒有人聽見，除了{name}。{name}正抱著{thing}，站在窗邊看著。\n\n廣場邊立著那棵大聖誕樹，樹上有一盞燈熄了。只有一盞，在靠近樹頂的地方。整棵樹看起來有點難過。\n\n{name}穿上靴子、圍好圍巾，走進安靜的夜裡，抬頭看。「我搆不到，」{name}說，「可是我可以許願。」\n\n於是{name}閉上眼睛許了願，不是為了禮物，而是希望那盞小燈能再亮起來。一陣暖暖的風吹過樹枝，遠遠地傳來雪橇的鈴聲。當{name}再抬起頭，那盞燈正發著金色的光，比其他的燈都還要亮。\n\n它亮了一整個冬天。有人說，它到現在還亮著。",
  ],
];

export function localStory(name: string, thing: string, lang: Lang, seed: number): string {
  const idx = lang === "zh" ? 1 : 0;
  const fallbackName = lang === "zh" ? "小星星" : "a child named Star";
  const fallbackThing = lang === "zh" ? "最喜歡的小毯子" : "a favourite blanket";
  return STORIES[seed % STORIES.length][idx]
    .replaceAll("{name}", name.trim() || fallbackName)
    .replaceAll("{thing}", thing.trim() || fallbackThing);
}

export const SUGGESTIONS: Pair[] = [
  ["How are the reindeer?", "馴鹿們好嗎？"],
  ["Am I on the nice list?", "我在好孩子名單上嗎？"],
  ["What is the North Pole like?", "北極是什麼樣子？"],
  ["Tell me a joke!", "講個笑話！"],
];
