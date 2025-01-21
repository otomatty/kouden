create policy "Allow users to read their own user info"
on "auth"."users"
as permissive
for select
to authenticated
using ((auth.uid() = id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


