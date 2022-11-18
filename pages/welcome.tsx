import {GetServerSideProps} from "next";
import {Box, Button, Stack, TextField, Typography} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import {Layout} from "../src/components/layout";
import {ContentHeader} from "../src/components/content-header";
import {useRouter} from "next/router";
import {withSessionServerSide} from "../src/server/with-session";


export const getServerSideProps: GetServerSideProps = withSessionServerSide(
    async ({query, req}): Promise<{ props: WelcomeProps }> => {

        return {
            props: {}
        }
    }
)


export type WelcomeProps = {}


export const Index = ({}: WelcomeProps) => {
    const router = useRouter();

    const onClick = () => {
        router.push('https://id.getharvest.com/oauth2/authorize?client_id=' + router.query.clientId + '&response_type=token');
    }

    return <>
        <Layout hasAdminAccess={false} userName={''} active={'day'}>
            <Box sx={{flexGrow: 1,}}>
                <Stack spacing={2}>
                    <Typography variant={'h4'}>Settings</Typography>
                    <TextField variant={'outlined'}
                               label={'Harvest Client Id'}
                               fullWidth
                               value={router.query.clientId}
                               onChange={(e) => router.replace({query: {...router.query, clientId: e.target.value}})}/>

                </Stack>

                <Box p={4}>
                    <ContentHeader title={'Welcome'} showPicker={false}/>
                    <Button color={'primary'}
                            fullWidth
                            size={'large'}
                            variant={'contained'}
                            onClick={onClick}
                    >Authenticate</Button>
                </Box>
            </Box>
        </Layout>
    </>
        ;
}
export default Index;
