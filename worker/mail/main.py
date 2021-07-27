import smtplib
import json

s = smtplib.SMTP('smtp.gmail.com', 587)


def formMessage(questions, answers):
    message = ""
    for (question, answer) in zip(questions, answers):
        message += f"Q. {question['text']} A. {answer}\n"
    return message


data_json = input()

data = json.loads(data_json)

email = data['job'].get('params', {}).get(
    'EMAIL', None)
password = data['job'].get('params', {}).get(
    'PASSWORD', None)
recieve_email = data['job'].get('params', {}).get(
    'TO', None)

message = f"Responses to the Form {data['form']['name']}\n\n" + formMessage(
    data['form']['questions'], data['response']['answers'])

print(message)

s.starttls()
s.login(email, password)

s.sendmail(email, recieve_email, message)

s.quit()
