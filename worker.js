export default {
  async fetch(request, env, ctx) {
    // 为跨域请求设置响应头，并处理 OPTIONS 预检请求
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // 为安全起见，建议替换为您的前端页面域名
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('请求方法无效，请使用 POST。', { status: 405, headers: corsHeaders });
    }

    let emailData;
    try {
      emailData = await request.json();
    } catch (error) {
      return new Response('无效的 JSON 数据。', { status: 400, headers: corsHeaders });
    }

    const RESEND_API_KEY = env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return new Response('未配置 Resend API Key。', { status: 500, headers: corsHeaders });
    }

    // 构造发送到 Resend API 的数据负载
    // **核心更新**：移除 tags，增加对 scheduled_at (定时发送) 的支持
    const sendData = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      ...(emailData.cc && { cc: emailData.cc }),
      ...(emailData.bcc && { bcc: emailData.bcc }),
      ...(emailData.reply_to && { reply_to: emailData.reply_to }),
      ...(emailData.attachments && { attachments: emailData.attachments }),
      ...(emailData.scheduled_at && { scheduled_at: emailData.scheduled_at }),
    };

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendData),
      });

      const responseBody = await resendResponse.json();
      const responseStatus = resendResponse.status;
      
      return new Response(JSON.stringify(responseBody), {
        status: responseStatus,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      return new Response(`发送邮件时出错: ${error.message}`, { status: 500, headers: corsHeaders });
    }
  },
};
