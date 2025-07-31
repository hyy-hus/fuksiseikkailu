export default {
    api: {
        input: "http://localhost:5173/api/openapi.json",
        output: {
            mode: "split",
            target: "src/api/endpoints.ts",
            schemas: "src/api/model",
            client: "react-query",
            override: {
                mutator: {
                    path: 'src/api/axios.ts',
                    name: 'customInstance'
                }
            }
        },
    },
};
