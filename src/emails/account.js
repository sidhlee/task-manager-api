const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API)

// TODO: Register you email domain at sendgrid.com > Sender Authentication > Domain Authentication

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'sidhlee@gmail.com',
    subject: `Welcome to taskapp.com. Here are 3 useful tips.`,
    text: `Hi ${name}, \n Thank you for joining our taskapp service. \n Here are three useful tips about using taskapp.com \n\t1. Try to keep your tasks simple. \n\t2. Use filter to organize your tasks.\n\t3. Check the task completed after you finished it.\n\nHope you can improve your workflow and get things done faster with taskapp.com!`,
    // html: // you can send out some fancy html with pictures and videos but study finds that people respond better to text emails.
  })
}

const sendGoodbyeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'sidhlee@gmail.com',
    subject: `Goodbye, ${name}. Thank you for using Taskapp.com`,
    text: `Hi ${name}, \n It looks like you recently deleted your Taskapp account. \nYou can get free stickers by filling out our short survey following the link below.\n It's been great to have you as our customer and we will try our best to improve our service.\n Sincerely, Taskapp team`,
  })
}

module.exports = {
  sendWelcomeEmail,
  sendGoodbyeEmail,
}
