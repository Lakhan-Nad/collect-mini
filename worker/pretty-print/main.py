import json


def formMessage(questions, answers):
    message = ""
    for (question, answer) in zip(questions, answers):
        message += f"Q. {question['text']} A. {answer}\n"
    return message


data_json = input()

data = json.loads(data_json)

message = f"Responses to the Form {data['form']['name']}\n\n" + formMessage(
    data['form']['questions'], data['response']['answers'])

print(message)
