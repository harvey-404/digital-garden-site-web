import { test, expect } from "@playwright/test";

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
