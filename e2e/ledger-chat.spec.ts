import { test, expect } from "@playwright/test";

const noon = 1791259200;
test.beforeEach(async ({ page }) => {
  let version=1, status="READY";
  let messages: object[]=[];
  let items=[
    {id:11,ordinal:1,amount:"32.50",categoryId:1001,description:"午饭",recordedAt:noon,datePrecision:"DATE",defaultedToday:true,future:false,sourceMessageId:1,sourceAttachmentIds:[],evidence:"午饭32块5",issues:[],duplicateExpenseIds:[],duplicateAcknowledged:false},
    {id:12,ordinal:2,amount:"18.00",categoryId:1002,description:"打车",recordedAt:noon,datePrecision:"DATE",defaultedToday:false,future:false,sourceMessageId:1,sourceAttachmentIds:[],evidence:"打车18",issues:[],duplicateExpenseIds:[],duplicateAcknowledged:false},
  ];
  let active=false;
  const draft=()=>({id:5,version,status,items,total:items.reduce((s,i)=>s+Number(i.amount),0).toFixed(2),count:items.length,canConfirm:status==="READY" && items.length>0,savedExpenses:status==="CONFIRMED"?items.map(i=>({...i,id:i.id+100})):[]});
  await page.addInitScript(()=>{localStorage.setItem("ledger_token","test-token");localStorage.setItem("dg-theme","light");});
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
    else if(path.endsWith("/chat/attachments"))data={id:88,contentType:"image/png",width:40,height:40};
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
