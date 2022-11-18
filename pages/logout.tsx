import {GetServerSideProps} from "next";
import "react-datepicker/dist/react-datepicker.css";
import {withServerSideSession} from "../src/server/with-session";


export const getServerSideProps: GetServerSideProps = withServerSideSession(
    async ({query, req}): Promise<any> => {
        await req.session.destroy()
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }
)




export const Logout = () => {
    return <></>;
}
export default Logout;
