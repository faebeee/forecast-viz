import {GetServerSideProps} from "next";
import {Box, Button, Grid} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import {Layout} from "../src/components/layout";
import {ContentHeader} from "../src/components/content-header";
import {useRouter} from "next/router";


export const getServerSideProps: GetServerSideProps = async ({query, req}): Promise<{ props: EntriesProps }> => {

    return {
        props: {}
    }
}


export type EntriesProps = {}


export const Index = ({}: EntriesProps) => {
    const router = useRouter();
    const harvestClientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID


    const onClick = () => {
        router.push('https://id.getharvest.com/oauth2/authorize?client_id='+harvestClientId+'&response_type=token');
    }

    return <>
        <Layout hasAdminAccess={false} userName={''} active={'day'}>
            <Box sx={{flexGrow: 1,}}>
                <Box p={4}>
                    <ContentHeader title={'Welcome'} showPicker={false}/>
                                    <Button color={ 'primary' }
                    fullWidth
                    size={ 'large' }
                    variant={ 'contained' }
                    onClick={ onClick }
                >Authenticate</Button>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Index;
