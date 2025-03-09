const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list")
const toggleButton = document.querySelector("#toggle-theme-button")
const suggestions = document.querySelectorAll(".suggestion-list .suggestion")
const deleteButton = document.querySelector("#delete-chat")
let usermessage = null;
let isResponseGenerate = false;

const API_KEY = "AIzaSyA3_95RuOIkAxGotPNv-VvgJwG6-Q0Xty8";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;


const localStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    document.body.classList.toggle("light_mode",isLightMode);
    toggleButton.innerText = isLightMode ? "dark_mode" : "light_mode";
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0,chatList.scrollHeight);
}

localStorageData();

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML= content;
    return div;
}

const showTypingEffect = (text, textElement,incomingMessageDiv) => {
    const words = text.split(' ');
    let currentwords = 0;
    const typingInterval = setInterval(() =>{
        textElement.innerText += (currentwords === 0 ? '' : ' ') + words[currentwords++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if(currentwords === words.length){
            clearInterval(typingInterval);
            isResponseGenerate = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats",chatList.innerHTML);
        }
        chatList.scrollTo(0,chatList.scrollHeight);
    },75);
}

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    try{
        const response = await fetch(API_URL,{
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{text: usermessage}]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
        showTypingEffect(apiResponse,textElement,incomingMessageDiv);
        console.log(apiResponse);
    } catch (error){
        isResponseGenerate = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally{
        incomingMessageDiv.classList.remove("loading");
    }
};

const showLoadingAnimation = () => {
    const html=`<div class="message-content">
                <img src="gemini.svg" alt="gemini image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator ">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
    const incomingMessageDiv = createMessageElement(html, 'incoming' , 'loading');
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0,chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText= 'done';
    setTimeout(() => copyIcon.innerText="content_copy",1000);
}

const handleOutgoingchat = () => {
    usermessage = document.querySelector(".typing-input").value.trim() || usermessage;
    if(!usermessage || isResponseGenerate) return;

    isResponseGenerate = true;
    const html=`<div class="message-content">
                <img src="user.jpg" alt="user image" class="avatar">
                <p class="text"></p>
            </div>`;
    const outgoingMessageDiv = createMessageElement(html, 'outgoing');
    outgoingMessageDiv.querySelector(".text").innerHTML=usermessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    chatList.scrollTo(0,chatList.scrollHeight);
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation,500);

};

suggestions.forEach(suggestion => {
    suggestion.addEventListener("click",() => {
        usermessage = suggestion.querySelector(".text").innerText;
        handleOutgoingchat();
    })
})

toggleButton.addEventListener("click",() =>{
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor",isLightMode ? "light_mode" : "dark_mode" )
    toggleButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});


deleteButton.addEventListener("click",() => {
    if(confirm("Are you sure! want to delete your chats?")){
        localStorage.removeItem("savedChats")
        localStorageData();
    }
});

typingForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    handleOutgoingchat();
});
