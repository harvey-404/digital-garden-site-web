import { test, expect } from "@playwright/test";

test("游客直接体验三轮，第三轮完整保留并展示登录注册返回入口",async({page})=>{
  let remaining=3;
  const messages: object[]=[];
  const guest=()=>({isGuest:true,remaining,limit:3});
  await page.route("**/api/account/me",route=>route.fulfill({status:401,json:{code:401,message:"请登录",data:null}}));
  await page.route("**/api/ledger/chat/session",route=>route.fulfill({json:{code:0,data:guest()}}));
  await page.route("**/api/ledger/chat/history*",route=>route.fulfill({json:{code:0,data:{messages,drafts:[],activeDraft:null,nextBeforeId:null,processingRequestId:null,capabilities:{available:true,imageInput:true},guest:guest()}}}));
  await page.route("**/api/ledger/chat/messages",route=>{
    const req=route.request().postDataJSON();remaining--;
    const user={id:messages.length+1,role:"user",text:req.text,attachmentIds:[],createdAt:noon,requestId:req.requestId,status:"DONE",draftId:null};
    const assistant={...user,id:messages.length+2,role:"assistant",text:`第${3-remaining}轮完整回复`};
    messages.push(user,assistant);return route.fulfill({json:{code:0,data:{userMessage:user,assistantMessage:assistant,draft:null}}});
  });
  await page.goto("/ledger/chat");
  await expect(page.getByText("游客体验 · 剩余 3/3 轮")).toBeVisible();
  for(let i=1;i<=3;i++) {
    await page.getByRole("textbox",{name:"消费描述"}).fill(`第${i}条消费`);
    await page.getByRole("button",{name:"发送消息"}).click();
    await expect(page.getByText(`第${i}轮完整回复`,{exact:true})).toBeVisible();
    await expect(page.getByText(`游客体验 · 剩余 ${3-i}/3 轮`)).toBeVisible();
  }
  await expect(page.getByRole("button",{name:"发送消息"})).toBeDisabled();
  await expect(page.getByRole("link",{name:"登录后继续",exact:true})).toHaveAttribute("href","/login?next=%2Fledger%2Fchat");
  await expect(page.getByRole("link",{name:"注册后继续",exact:true})).toHaveAttribute("href","/register?next=%2Fledger%2Fchat");
  await page.reload();await expect(page.getByText("第3轮完整回复",{exact:true})).toBeVisible();
});

test("游客草稿登录接续时保留账号旧记录，退出后隐藏私有历史",async({page})=>{
  let signed=false,retired=false;
  const account={id:7,email:"reader@example.com",displayName:"邮箱用户",timezone:"Asia/Shanghai",links:{ledger:true,tracker:false}};
  const item={id:11,ordinal:1,amount:"32.50",categoryId:1001,description:"游客午饭",recordedAt:noon,datePrecision:"DATE",defaultedToday:false,future:false,sourceMessageId:1,sourceAttachmentIds:[],evidence:"",issues:[],duplicateExpenseIds:[],duplicateAcknowledged:false};
  const draft={id:5,version:2,status:"READY",items:[item],total:"32.50",count:1,canConfirm:true,savedExpenses:[]};
  const guestMessage={id:2,role:"assistant",text:"游客的第三轮完整回复",attachmentIds:[],createdAt:noon,requestId:"guest-three",status:"DONE",draftId:5};
  await page.route("**/api/account/me",route=>route.fulfill({status:signed?200:401,json:{code:signed?0:401,data:signed?account:null}}));
  await page.route("**/api/account/status",route=>route.fulfill({json:{code:0,data:{mailConfigured:true}}}));
  await page.route("**/api/account/login",route=>{signed=true;retired=true;return route.fulfill({json:{code:0,data:account}});});
  await page.route("**/api/account/logout",route=>{signed=false;return route.fulfill({json:{code:0,data:null}});});
  await page.route("**/api/ledger/chat/session",route=>route.fulfill({status:!signed&&retired?401:200,json:{code:!signed&&retired?401:0,data:{isGuest:!signed,remaining:signed?null:0,limit:3}}}));
  await page.route("**/api/ledger/chat/history*",route=>route.fulfill({json:{code:0,data:{messages:signed?[{...guestMessage,id:1,text:"账号原来的记录",draftId:null},guestMessage]:[guestMessage],drafts:[draft],activeDraft:draft,nextBeforeId:null,processingRequestId:null,capabilities:{available:true,imageInput:true},guest:{isGuest:!signed,remaining:signed?null:0,limit:3}}}}));
  await page.goto("/ledger");await expect(page).toHaveURL(/\/ledger\/chat$/);
  await expect(page.getByText("游客的第三轮完整回复",{exact:true})).toBeVisible();
  await expect(page.getByText("游客午饭",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"确认全部记账"})).toHaveCount(0);
  await page.getByRole("link",{name:"登录后继续",exact:true}).click();
  await page.getByLabel("邮箱",{exact:true}).fill("reader@example.com");
  await page.getByLabel("密码",{exact:true}).fill("password123");
  await page.getByRole("button",{name:"登录",exact:true}).click();
  await expect(page).toHaveURL(/\/ledger\/chat$/);
  await expect(page.getByText("游客的第三轮完整回复",{exact:true})).toBeVisible();
  await expect(page.getByText("账号原来的记录",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"确认全部记账"})).toBeEnabled();
  await page.getByRole("button",{name:"退出",exact:true}).click();
  await page.goto("/ledger/chat");await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText("账号原来的记录",{exact:true})).toHaveCount(0);
});

async function dragFiles(page: import("@playwright/test").Page, files: {name: string; type: string}[], event: string, waitUntilReady = true) {
  if (waitUntilReady) await expect(page.getByRole("textbox",{name:"消费描述"})).toBeEnabled();
  const transfer=await page.evaluateHandle(files=>{
    const data=new DataTransfer();
    for(const file of files)data.items.add(new File([new Uint8Array([137,80,78,71])],file.name,{type:file.type}));
    return data;
  },files);
  await page.getByRole("textbox",{name:"消费描述"}).dispatchEvent(event,{dataTransfer:transfer});
  await transfer.dispose();
}

test("编辑迁入游客草稿不会切换账号当前草稿",async({page})=>{
  const item={id:11,ordinal:1,amount:"10",categoryId:1001,description:"游客咖啡",recordedAt:noon,datePrecision:"DATE",defaultedToday:false,future:false,sourceMessageId:1,sourceAttachmentIds:[],evidence:"",issues:[],duplicateExpenseIds:[],duplicateAcknowledged:false};
  let guestDraft={id:5,version:2,status:"READY",items:[item],total:"10.00",count:1,canConfirm:true,savedExpenses:[]};
  const accountDraft={...guestDraft,id:6,version:9,items:[{...item,id:21,description:"账号午饭"}]};
  const messages:object[]=[{id:1,role:"assistant",text:"账号原草稿",attachmentIds:[],createdAt:noon,requestId:"account",status:"DONE",draftId:6},{id:2,role:"assistant",text:"迁入游客草稿",attachmentIds:[],createdAt:noon,requestId:"guest",status:"DONE",draftId:5}];
  let sentVersion:number|null=null;
  await page.route("**/api/ledger/chat/history*",route=>route.fulfill({json:{code:0,data:{messages,drafts:[accountDraft,guestDraft],activeDraft:accountDraft,nextBeforeId:null,processingRequestId:null,capabilities:{available:true,imageInput:true},guest:{isGuest:false,remaining:null,limit:3,identityKey:"ledger:7",adoptedGuestKey:null}}}}));
  await page.route("**/api/ledger/chat/drafts/5/items/11*",route=>{
    if(route.request().method()==="DELETE")guestDraft={...guestDraft,version:4,status:"NEEDS_INPUT",items:[],count:0,total:"0.00",canConfirm:false};
    else guestDraft={...guestDraft,version:3,items:[{...item,amount:"15"}],total:"15.00"};
    return route.fulfill({json:{code:0,data:guestDraft}});
  });
  await page.route("**/api/ledger/chat/messages",route=>{
    const req=route.request().postDataJSON();sentVersion=req.expectedDraftVersion;
    if(sentVersion!==9)return route.fulfill({json:{code:409,message:"草稿版本不匹配"}});
    const user={id:3,role:"user",text:req.text,attachmentIds:[],createdAt:noon,requestId:req.requestId,status:"DONE",draftId:6};
    const assistant={...user,id:4,role:"assistant",text:"继续更新账号原草稿"};messages.push(user,assistant);
    return route.fulfill({json:{code:0,data:{userMessage:user,assistantMessage:assistant,draft:accountDraft}}});
  });
  await page.goto("/ledger/chat");
  await page.locator("#draft-5").getByRole("button",{name:"编辑第1笔"}).click();
  await page.getByRole("textbox",{name:"金额"}).fill("15");await page.getByRole("button",{name:"保存修改"}).click();
  await page.locator("#draft-5").getByRole("button",{name:"移除第1笔"}).click();
  await expect(page.locator("#draft-5").getByText("已移除所有条目，可继续补充或取消本次草稿。")).toBeVisible();
  await page.getByRole("textbox",{name:"消费描述"}).fill("继续记账号午饭");await page.getByRole("button",{name:"发送消息"}).click();
  await expect(page.getByText("继续更新账号原草稿",{exact:true})).toBeVisible();expect(sentVersion).toBe(9);
});

test("未发送文字和图片经焦点刷新与登录保留且隔离下一账号",async({page})=>{
  let accountId:number|null=null;
  const identity=()=>accountId?{isGuest:false,remaining:null,limit:3,identityKey:`ledger:${accountId}`,adoptedGuestKey:accountId===7?"guest:100":null}:{isGuest:true,remaining:3,limit:3,identityKey:"guest:100",adoptedGuestKey:null};
  const account=()=>({id:accountId,email:"reader@example.com",displayName:"邮箱用户",timezone:"Asia/Shanghai",links:{ledger:true,tracker:false}});
  await page.route("**/api/account/me",route=>route.fulfill({status:accountId?200:401,json:{code:accountId?0:401,data:accountId?account():null}}));
  await page.route("**/api/account/status",route=>route.fulfill({json:{code:0,data:{mailConfigured:true}}}));
  await page.route("**/api/account/login",route=>{accountId=7;return route.fulfill({json:{code:0,data:account()}});});
  await page.route("**/api/ledger/chat/session",route=>route.fulfill({json:{code:0,data:identity()}}));
  await page.route("**/api/ledger/chat/history*",route=>route.fulfill({json:{code:0,data:{messages:[],drafts:[],activeDraft:null,nextBeforeId:null,processingRequestId:null,capabilities:{available:true,imageInput:true},guest:identity()}}}));
  await page.goto("/ledger/chat");const text=page.getByRole("textbox",{name:"消费描述"});
  await text.fill("这笔消费还没有发送");
  await page.locator('input[type="file"]').setInputFiles({name:"receipt.png",mimeType:"image/png",buffer:Buffer.from([137,80,78,71])});
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(text).toHaveValue("这笔消费还没有发送");await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
  await page.locator(".chat-guest-banner").getByRole("link",{name:"登录",exact:true}).click();
  await page.getByLabel("邮箱",{exact:true}).fill("reader@example.com");await page.getByLabel("密码",{exact:true}).fill("password123");
  await page.getByRole("button",{name:"登录",exact:true}).click();await expect(page).toHaveURL(/\/ledger\/chat$/);
  await expect(text).toHaveValue("这笔消费还没有发送");await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
  accountId=8;await page.evaluate(()=>window.dispatchEvent(new Event("account:changed")));
  await expect(text).toHaveValue("");await expect(page.getByAltText("待发送的消费图片")).toHaveCount(0);
});

for(const fromOpener of [false,true])test(`同一账号两标签页的未发送图片互不覆盖${fromOpener ? "（复制会话）" : "（独立会话）"}`,async({page,context})=>{
  const configure=async(tab:typeof page)=>tab.route("**/api/**",route=>{
    const path=new URL(route.request().url()).pathname;
    if(!path.startsWith("/api/"))return route.continue();
    let data:unknown=[];
    if(path==="/api/account/me")data={id:7,email:"reader@example.com",displayName:"邮箱用户",timezone:"Asia/Shanghai",links:{ledger:true,tracker:false}};
    else if(path==="/api/ledger/auth/me")data={userSn:"account7",displayName:"邮箱用户",defaultBudgetAmount:3000,status:"active",onboardingDone:true};
    else if(path==="/api/ledger/chat/history")data={messages:[],drafts:[],activeDraft:null,nextBeforeId:null,processingRequestId:null,capabilities:{available:true,imageInput:true},guest:{isGuest:false,remaining:null,limit:3,identityKey:"ledger:7",adoptedGuestKey:null}};
    return route.fulfill({json:{code:0,data}});
  });
  await configure(page);
  await page.goto("/ledger/chat");await page.getByRole("textbox",{name:"消费描述"}).fill("标签页一的消费");
  await page.locator('input[type="file"]').setInputFiles({name:"first.png",mimeType:"image/png",buffer:Buffer.from([137,80,78,71])});
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
  let second:typeof page;
  if(fromOpener){
    const popup=page.waitForEvent("popup");
    await page.evaluate(()=>{window.open("about:blank","_blank");});
    second=await popup;
  }else second=await context.newPage();
  await configure(second);
  await second.goto("/ledger/chat");await second.getByRole("textbox",{name:"消费描述"}).fill("标签页二的消费");
  if(fromOpener){
    await expect(second.getByAltText("待发送的消费图片")).toHaveCount(1);
    await second.getByRole("button",{name:"移除待发送图片"}).click();
  }
  await second.locator('input[type="file"]').setInputFiles({name:"second.png",mimeType:"image/png",buffer:Buffer.from([137,80,78,71])});
  await second.reload();await expect(second.getByAltText("待发送的消费图片")).toHaveCount(1);
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("textbox",{name:"消费描述"})).toHaveValue("标签页一的消费");
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
  await second.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(second.getByRole("textbox",{name:"消费描述"})).toHaveValue("标签页二的消费");
  await expect(second.getByAltText("待发送的消费图片")).toHaveCount(1);
});

const noon = 1791259200;
test.beforeEach(async ({ page }) => {
  let version=1, status="READY", attachmentId=88;
  let messages: object[]=[];
  let items=[
    {id:11,ordinal:1,amount:"32.50",categoryId:1001,description:"午饭",recordedAt:noon,datePrecision:"DATE",defaultedToday:true,future:false,sourceMessageId:1,sourceAttachmentIds:[],evidence:"午饭32块5",issues:[],duplicateExpenseIds:[],duplicateAcknowledged:false},
    {id:12,ordinal:2,amount:"18.00",categoryId:1002,description:"打车",recordedAt:noon,datePrecision:"DATE",defaultedToday:false,future:false,sourceMessageId:1,sourceAttachmentIds:[],evidence:"打车18",issues:[],duplicateExpenseIds:[],duplicateAcknowledged:false},
  ];
  let active=false;
  const draft=()=>({id:5,version,status,items,total:items.reduce((s,i)=>s+Number(i.amount),0).toFixed(2),count:items.length,canConfirm:status==="READY" && items.length>0,savedExpenses:status==="CONFIRMED"?items.map(i=>({...i,id:i.id+100})):[]});
  await page.addInitScript(()=>{localStorage.setItem("dg-theme","light");});
  await page.route("**/api/account/me", route => route.fulfill({json:{code:0,message:"success",data:{id:1,email:"reader@example.com",displayName:"测试用户",timezone:"Asia/Shanghai",links:{ledger:true,tracker:false}}}}));
  await page.route("**/api/ledger/**",async route=>{
    const url=new URL(route.request().url()),path=url.pathname,method=route.request().method();
    let data: unknown=null;
    if(path.endsWith("/auth/me"))data={userSn:"test",displayName:"测试用户",defaultBudgetAmount:3000,status:"active",onboardingDone:true};
    else if(path.endsWith("/categories"))data=[{id:1001,name:"餐饮",icon:"",sortOrder:0},{id:1002,name:"交通",icon:"",sortOrder:1}];
    else if(path.endsWith("/chat/history"))data={messages,drafts:active?[draft()]:[],activeDraft:active && status==="READY"?draft():null,nextBeforeId:null,processingRequestId:null,capabilities:{available:true,imageInput:true}};
    else if(path.endsWith("/chat/messages")) {
      const body=route.request().postDataJSON();active=true;
      if(messages.length) {items[1].amount="20.00";version++;}
      const user={id:messages.length+1,role:"user",text:body.text,attachmentIds:body.attachmentIds,createdAt:noon,requestId:body.requestId,status:"DONE",draftId:5};
      const assistant={id:messages.length+2,role:"assistant",text:"请核对消费，确认后记入账本。",attachmentIds:[],createdAt:noon,requestId:body.requestId,status:"DONE",draftId:5};
      messages.push(user,assistant);data={userMessage:user,assistantMessage:assistant,draft:draft()};
    } else if(path.endsWith("/confirm")) {status="CONFIRMED";version++;data=draft();}
    else if(path.endsWith("/revoke")) {status="REVOKED";version++;data=draft();}
    else if(path.endsWith("/cancel")) {status="CANCELLED";version++;data=draft();}
    else if(path.includes("/items/") && method==="DELETE") {const id=Number(path.split("/").pop());items=items.filter(i=>i.id!==id);version++;data=draft();}
    else if(path.includes("/items/") && method==="PUT") {const id=Number(path.split("/").pop());const body=route.request().postDataJSON();items=items.map(i=>i.id===id?{...i,...body}:i);version++;data=draft();}
    else if(path.endsWith("/chat/attachments"))data={id:attachmentId++,contentType:"image/png",width:40,height:40};
    else {await route.fulfill({json:{code:404,message:"测试接口不存在",data:null}});return;}
    await route.fulfill({json:{code:0,message:"success",data}});
  });
});

test("文字多笔与对话修改后整批确认",async({page})=>{
  await page.goto("/ledger/chat");
  await expect(page.getByRole("heading",{name:"对话记账",exact:true})).toBeVisible();
  await page.getByRole("textbox",{name:"消费描述"}).fill("午饭32块5，打车18");
  await page.getByRole("button",{name:"发送消息"}).click();
  await expect(page.getByText("¥50.50",{exact:true})).toBeVisible();
  await page.getByRole("textbox",{name:"消费描述"}).fill("第二笔改成20");
  await page.getByRole("button",{name:"发送消息"}).click();
  await expect(page.getByText("¥52.50",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"确认全部记账"}).click();
  await expect(page.getByText("已记账",{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByText("已记账",{exact:true})).toBeVisible();
});
test("单行编辑与移除",async({page})=>{
  await page.goto("/ledger/chat");
  await page.getByRole("textbox",{name:"消费描述"}).fill("午饭32块5，打车18");
  await page.getByRole("button",{name:"发送消息"}).click();
  await page.getByRole("button",{name:"编辑第1笔"}).click();
  await page.getByRole("textbox",{name:"金额"}).fill("35.00");
  await page.getByRole("button",{name:"保存修改"}).click();
  await expect(page.getByText("¥53.00",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"移除第2笔"}).click();
  await expect(page.getByText("¥35.00",{exact:true}).last()).toBeVisible();
});
test("320px与深色模式没有横向溢出",async({page})=>{
  await page.setViewportSize({width:320,height:740});await page.goto("/ledger/chat");
  await expect(page.getByRole("heading",{name:"对话记账",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(()=>{document.documentElement.dataset.theme="dark";});
  await page.screenshot({path:"e2e-report/chat-screens/mobile-dark.png"});
});
test("撤销需要确认且保留结果",async({page})=>{
  await page.goto("/ledger/chat");await page.getByRole("textbox",{name:"消费描述"}).fill("午饭32块5，打车18");
  await page.getByRole("button",{name:"发送消息"}).click();await page.getByRole("button",{name:"确认全部记账"}).click();
  await page.getByRole("button",{name:"撤销本次记账"}).click();
  await page.getByRole("button",{name:"确定撤销"}).click();await expect(page.getByText("已撤销",{exact:true})).toBeVisible();
});

test("拖入图片显示提示与预览，发送时上传",async({page})=>{
  await page.goto("/ledger/chat");
  const files=[{name:"receipt.png",type:"image/png"},{name:"receipt2.jpg",type:"image/jpeg"}];
  await dragFiles(page,files,"dragenter");
  await expect(page.getByRole("status").filter({hasText:"松开添加消费图片"})).toBeVisible();
  await dragFiles(page,files,"drop");
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(2);
  await expect(page.getByRole("button",{name:"发送消息"})).toBeEnabled();
  const upload=page.waitForRequest(r=>r.url().endsWith("/chat/attachments") && r.method()==="POST");
  await page.getByRole("button",{name:"发送消息"}).click();
  await upload;
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(0);
  await expect(page.getByText("¥50.50",{exact:true})).toBeVisible();
});

test("拖入图片沿用数量和格式限制",async({page})=>{
  await page.goto("/ledger/chat");
  await dragFiles(page,[{name:"notes.txt",type:"text/plain"}],"drop");
  await expect(page.getByText("请选择JPEG、PNG或WebP图片；HEIC请先转为JPEG")).toBeVisible();
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(0);
  await dragFiles(page,[{name:"receipt.png",type:"image/png"}],"drop");
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
  await dragFiles(page,Array.from({length:3},(_,i)=>({name:`receipt${i}.png`,type:"image/png"})),"drop");
  await expect(page.getByText("一次最多3张图片，请分批发送")).toBeVisible();
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(1);
});

test("过大图片被拒绝，处理消息时禁止拖入",async({page})=>{
  await page.goto("/ledger/chat");
  await expect(page.getByRole("textbox",{name:"消费描述"})).toBeEnabled();
  const large=await page.evaluateHandle(()=>{
    const data=new DataTransfer();data.items.add(new File([new Uint8Array(10*1024*1024+1)],"large.png",{type:"image/png"}));return data;
  });
  await page.getByRole("textbox",{name:"消费描述"}).dispatchEvent("drop",{dataTransfer:large});await large.dispose();
  await expect(page.getByText("每张图片最多10MB")).toBeVisible();
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(0);
  let release!: ()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route("**/api/ledger/chat/messages",async route=>{await gate;await route.fallback();});
  await page.getByRole("textbox",{name:"消费描述"}).fill("午饭32块5，打车18");
  await page.getByRole("button",{name:"发送消息"}).click();
  await expect(page.getByRole("textbox",{name:"消费描述"})).toBeDisabled();
  await dragFiles(page,[{name:"receipt.png",type:"image/png"}],"drop",false);
  await expect(page.getByAltText("待发送的消费图片")).toHaveCount(0);
  release();await expect(page.getByText("¥50.50",{exact:true})).toBeVisible();
});
