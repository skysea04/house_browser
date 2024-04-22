export async function notify(acessToken: string, message: string) {
    const response = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${acessToken}`,
        },
        body: `message=${message}`,
    });
    return response.status === 200;
};