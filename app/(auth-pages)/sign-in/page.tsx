import { SignInForm } from "./sign-in-form";

export default async function Login(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  return <SignInForm searchParams={searchParams} />;
}
