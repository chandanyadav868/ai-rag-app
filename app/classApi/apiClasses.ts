import { error } from "console";

class ApiClass {
    private endpoint: string;
    private headers: Record<string, string>
    constructor(endpoint: string) {
        this.endpoint = endpoint
        this.headers = {
            'Content-Type': 'application/Json'
        }
    }

    // endpoint, header, body
    async Post(enpoint: string, headers: Record<string, string> = {}, body: Record<string, any>) {
        try {
            console.log('data in apiClass:- ', body);

            const response = await fetch(`${this.endpoint}/${enpoint}`, {
                method: 'POST',
                headers: {
                    ...headers,
                    ...this.headers
                },
                body: JSON.stringify(body)
            });

            const responseJson = await response.json();
            console.log('responseJson:- ', responseJson);

            if (responseJson.status === 200) {
                return responseJson;
            };

            throw new Error(JSON.stringify(responseJson));

        } catch (error) {
            const errorObject = error as { message: string, name: string }
            throw new Error(errorObject.message as string)
        }
    }

    async Get(enpoint: string) {
        try {

            const response = await fetch(`${this.endpoint}/${enpoint}`, {
                method: 'GET',
                headers: {
                    ...this.headers
                }
            });

            const responseJson = await response.json();
            console.log('responseJson Get:- ', responseJson);

            if (responseJson.status === 200) {
                return responseJson;
            };

            throw new Error(JSON.stringify(responseJson));

        } catch (error) {
            const errorObject = error as { message: string, name: string }
            throw new Error(errorObject.message as string)
        }
    }
}

export const ApiEndpoint = new ApiClass('/api') 