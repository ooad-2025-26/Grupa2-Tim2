using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Task6.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            var settings = _configuration.GetSection("EmailSettings");

            var email = new MimeMessage();

            email.From.Add(new MailboxAddress(
                settings["SenderName"],
                settings["SenderEmail"]));

            email.To.Add(MailboxAddress.Parse(toEmail));

            email.Subject = subject;

            email.Body = new TextPart("html")
            {
                Text = message
            };

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                settings["SmtpServer"],
                int.Parse(settings["Port"]),
                SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                settings["SenderEmail"],
                settings["Password"]);

            await smtp.SendAsync(email);

            await smtp.DisconnectAsync(true);
        }
    }
}