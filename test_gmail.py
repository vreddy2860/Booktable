import yagmail

yag = yagmail.SMTP("rpooja211999@gmail.com", "izhevhpphnebvuyf")
yag.send(
    to="pooja.r.sindham@gmail.com",
    subject="Quick hi from Yagmail",
    contents="This was sent in one call!"
)
print("Email sent via Yagmail!")