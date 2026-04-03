import axios from "axios";

export default {
  name: "deepseek",
  alias: ["ds", "seek", "ai"],
  desc: "Chat with DeepSeek AI assistant 🧠",
  category: "general",
  usage: ".deepseek [your message]",

  async execute(sock, m, args) {
    try {
      const chatId = m.key.remoteJid;
      const userMessage = args.join(" ").trim();

      // Check if user provided a message
      if (!userMessage) {
        await sock.sendMessage(chatId, {
          text: "🧠 *Please provide a message!*\n\nExample: `.deepseek What is the meaning of life?`",
        });
        return;
      }

      // Send typing indicator
      await sock.sendPresenceUpdate("composing", chatId);

      // Call the DeepSeek API
      const response = await axios.post(
        "https://apis.xwolf.space/api/ai/deepseek",
        {
          prompt: userMessage,
          // Optional system prompt
          // system: "You are DeepSeek, a helpful AI assistant.",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      // Extract the AI response
      const aiResponse = response.data.response || response.data.message || JSON.stringify(response.data);

      // Send the response
      await sock.sendMessage(chatId, {
        text: `🧠 *DeepSeek AI:*\n\n${aiResponse}`,
      });

    } catch (error) {
      console.error("🧠 Error in deepseek command:", error);

      let errorMessage = "❌ Failed to get response from DeepSeek!";

      if (error.code === "ECONNABORTED") {
        errorMessage = "⏱️ Request timeout! DeepSeek is taking too long to respond.";
      } else if (error.response) {
        errorMessage = `⚠️ API Error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = "🌐 Network error! Could not reach DeepSeek service.";
      }

      await sock.sendMessage(m.key.remoteJid, {
        text: errorMessage,
      });
    }
  },
};